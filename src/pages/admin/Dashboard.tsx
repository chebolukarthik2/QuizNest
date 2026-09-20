import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Link } from "react-router";
import { Plus, FileText, BookOpen, Trophy, Eye } from "lucide-react";

export default function AdminDashboard() {
  const quizzes = useQuery(api.quizzes.getAllQuizzes);
  const stats = useQuery(api.quizzes.getQuizStats);
  const resultStats = useQuery(api.results.getResultStats);

  const isLoading = quizzes === undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage quizzes, questions, and view results
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? "—" : stats?.total ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Quizzes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {isLoading ? "—" : stats?.published ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Published</p>
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
                    {isLoading ? "—" : resultStats?.total ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Student Results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/admin/quizzes/create">
              <Button className="gap-1.5">
                <Plus className="size-4" />
                Create Quiz
              </Button>
            </Link>
            <Link to="/admin/quizzes/publish">
              <Button variant="outline" className="gap-1.5">
                Publish Quiz
              </Button>
            </Link>
            <Link to="/admin/results">
              <Button variant="outline" className="gap-1.5">
                <Eye className="size-4" />
                View Results
              </Button>
            </Link>
          </div>

          {/* Quiz List */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">All Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSpinner />
              ) : !quizzes?.length ? (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No quizzes yet"
                  description="Create your first quiz to get started."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                        <th className="pb-2 pr-4">Title</th>
                        <th className="pb-2 pr-4">Marks</th>
                        <th className="pb-2 pr-4">Duration</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizzes.map((quiz) => (
                        <tr
                          key={quiz._id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium">
                            {quiz.title}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {quiz.totalMarks}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {quiz.duration} min
                          </td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={quiz.status} />
                          </td>
                          <td className="py-3">
                            <Link
                              to={`/admin/quizzes/${quiz._id}/questions`}
                            >
                              <Button variant="ghost" size="sm">
                                Questions
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
