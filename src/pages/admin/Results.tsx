import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeft, Search, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const ALL_SUBJECTS = "all";

export default function AdminResults() {
  const results = useQuery(api.results.getAllResults);
  const quizzes = useQuery(api.quizzes.getAllQuizzes);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS);

  const isLoading = results === undefined || quizzes === undefined;

  // Every subject in the catalogue, so a newly created quiz shows up here
  // immediately. Result titles are merged in as well in case a quiz that has
  // attempts was later removed from the catalogue.
  const subjects = useMemo(() => {
    const names = new Set<string>();
    quizzes?.forEach((q) => names.add(q.title));
    results?.forEach((r) => names.add(r.quizTitle));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [quizzes, results]);

  // Attempts per subject, shown beside each option
  const attemptsBySubject = useMemo(() => {
    const counts = new Map<string, number>();
    results?.forEach((r) => {
      counts.set(r.quizTitle, (counts.get(r.quizTitle) ?? 0) + 1);
    });
    return counts;
  }, [results]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (results ?? []).filter((r) => {
      if (subject !== ALL_SUBJECTS && r.quizTitle !== subject) return false;
      if (!term) return true;
      return (
        r.studentName.toLowerCase().includes(term) ||
        r.studentEmail.toLowerCase().includes(term) ||
        r.quizTitle.toLowerCase().includes(term)
      );
    });
  }, [results, search, subject]);

  // Subject-wise (or overall) score summary for whatever is currently shown
  const summary = useMemo(() => {
    if (!filtered.length) return null;
    const marks = filtered.reduce((sum, r) => sum + (r.totalMarks || 0), 0);
    const scored = filtered.reduce((sum, r) => sum + r.score, 0);
    const correct = filtered.reduce((sum, r) => sum + r.correctAnswers, 0);
    const questions = filtered.reduce((sum, r) => sum + r.totalQuestions, 0);
    return {
      attempts: filtered.length,
      scored,
      marks,
      percentage: marks > 0 ? Math.round((scored / marks) * 100) : 0,
      accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
    };
  }, [filtered]);

  const isFiltering = search.trim() !== "" || subject !== ALL_SUBJECTS;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Student Results
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View all student quiz attempts and scores
            </p>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="size-4" />
                Results Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search + subject filter */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by student name, email or subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                    aria-label="Search results"
                  />
                </div>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="sm:w-56" aria-label="Filter by subject">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SUBJECTS}>All subjects</SelectItem>
                    {subjects.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name} ({attemptsBySubject.get(name) ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isFiltering && (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => {
                      setSearch("");
                      setSubject(ALL_SUBJECTS);
                    }}
                  >
                    <X className="size-3.5" />
                    Clear
                  </Button>
                )}
              </div>

              {isLoading ? (
                <LoadingSpinner />
              ) : !results?.length ? (
                <EmptyState
                  icon={<Trophy className="size-5" />}
                  title="No student results are available yet"
                  description="Results will appear here once students attempt and submit quizzes."
                />
              ) : !filtered.length ? (
                <EmptyState
                  icon={<Search className="size-5" />}
                  title={
                    subject !== ALL_SUBJECTS && !search.trim()
                      ? `No attempts for ${subject} yet`
                      : "No results match your filters"
                  }
                  description={
                    subject !== ALL_SUBJECTS && !search.trim()
                      ? "This subject has no student submissions yet. It will appear in the summary once someone attempts it."
                      : "Try a different student name, email or subject."
                  }
                />
              ) : (
                <>
                  {/* Subject-wise score summary */}
                  {summary && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Attempts</p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.attempts}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Score
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.scored}/{summary.marks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg. Score
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.percentage}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Avg. Accuracy
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.accuracy}%
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                          <th className="pb-2 pr-4">Student</th>
                          <th className="pb-2 pr-4">Email</th>
                          <th className="pb-2 pr-4">Subject</th>
                          <th className="pb-2 pr-4">Score</th>
                          <th className="pb-2 pr-4">Grade</th>
                          <th className="pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((result) => {
                          const percentage =
                            result.totalMarks > 0
                              ? Math.round(
                                  (result.score / result.totalMarks) * 100,
                                )
                              : 0;
                          return (
                            <tr
                              key={result._id}
                              className="border-b border-border last:border-0"
                            >
                              <td className="py-3 pr-4 font-medium">
                                {result.studentName}
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground text-xs">
                                {result.studentEmail}
                              </td>
                              <td className="py-3 pr-4">{result.quizTitle}</td>
                              <td className="py-3 pr-4">
                                <span className="font-medium">
                                  {result.score}/{result.totalMarks}
                                </span>
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                  ({percentage}%)
                                </span>
                              </td>
                              <td className="py-3 pr-4 font-medium">
                                {result.grade}
                              </td>
                              <td className="py-3">
                                <StatusBadge status={result.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
