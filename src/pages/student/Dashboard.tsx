import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { BookOpen, ClipboardCheck, Trophy } from "lucide-react";
import { Link } from "react-router";

export default function StudentDashboard() {
  const { user } = useAuth();
  const quizzes = useQuery(api.quizzes.getPublishedQuizzes);
  const results = useQuery(api.results.getStudentResults);

  const isLoading = quizzes === undefined || results === undefined;
  const studentProfile = user?.role === "student" ? (user as { studentProfile?: { course?: string; semester?: string } }).studentProfile : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome, {user?.name || "Student"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {studentProfile?.course} — Semester{" "}
              {studentProfile?.semester}
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? "—" : quizzes?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available Quizzes
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ClipboardCheck className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? "—" : results?.length ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quizzes Attempted
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading
                      ? "—"
                      : results?.length
                        ? `${Math.round(
                            results.reduce(
                              (acc, r) =>
                                acc +
                                (r.totalQuestions > 0
                                  ? (r.correctAnswers / r.totalQuestions) * 100
                                  : 0),
                                0,
                            ) / results.length,
                          )}%`
                        : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg. Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-8">
            <Link to="/student/quizzes">
              <Button>Browse Quizzes</Button>
            </Link>
          </div>

          {/* Recent Results */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : !results?.length ? (
                <EmptyState
                  icon={<Trophy className="size-5" />}
                  title="No results yet"
                  description="Take a quiz to see your results here."
                />
              ) : (
                <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
                    <Link
                      key={result._id}
                      to={`/student/result/${result._id}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {result.quiz?.title ?? "Quiz"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Score: {result.score}/{result.quiz?.totalMarks} •{" "}
                          Grade: {result.grade}
                        </p>
                      </div>
                      <StatusBadge status={result.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
