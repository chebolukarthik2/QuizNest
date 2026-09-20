import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Send, Settings } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminPublishQuiz() {
  const quizzes = useQuery(api.quizzes.getAllQuizzes);
  const publishQuiz = useMutation(api.quizzes.publishQuiz);

  // Only show Created quizzes that can be published
  const createdQuizzes =
    quizzes?.filter((q) => q.status === "Created") ?? [];
  const publishedQuizzes =
    quizzes?.filter((q) => q.status === "Published") ?? [];

  const isLoading = quizzes === undefined;

  const handlePublish = async (quizId: string) => {
    try {
      await publishQuiz({ quizId: quizId as Id<"quizzes"> });
      toast.success("Quiz published successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish quiz.",
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Publish Quiz
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish created quizzes to make them available to students
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Created Quizzes - Can be published */}
              <Card className="shadow-sm mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="size-4" />
                    Ready to Publish
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!createdQuizzes.length ? (
                    <EmptyState
                      title="No quizzes to publish"
                      description="All quizzes have been published or none have been created yet."
                    />
                  ) : (
                    <div className="space-y-3">
                      {createdQuizzes.map((quiz) => (
                        <div
                          key={quiz._id}
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
                          <div>
                            <p className="font-medium text-sm">{quiz.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {quiz.totalMarks} marks • {quiz.duration} min
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={quiz.status} />
                            <Button
                              size="sm"
                              onClick={() => handlePublish(quiz._id)}
                              className="gap-1"
                            >
                              <Send className="size-3.5" />
                              Publish
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Published Quizzes */}
              {publishedQuizzes.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Already Published
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {publishedQuizzes.map((quiz) => (
                        <div
                          key={quiz._id}
                          className="flex items-center justify-between rounded-lg border border-border p-4"
                        >
                          <div>
                            <p className="font-medium text-sm">{quiz.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {quiz.totalMarks} marks • {quiz.duration} min
                            </p>
                          </div>
                          <StatusBadge status={quiz.status} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
