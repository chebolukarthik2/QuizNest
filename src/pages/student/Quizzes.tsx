import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { BookOpen, Clock, Hash, Play, Eye } from "lucide-react";
import { Link } from "react-router";
import type { Id } from "@/convex/_generated/dataModel";

export default function StudentQuizzes() {
  const quizzes = useQuery(api.quizzes.getPublishedQuizzes);
  const results = useQuery(api.results.getStudentResults);

  const isLoading = quizzes === undefined || results === undefined;

  // Map each attempted quiz to the result the student can open
  const resultByQuiz = new Map<string, Id<"results">>();
  results?.forEach((r) => {
    resultByQuiz.set(r.quizId, r._id);
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Available Quizzes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a published quiz to begin your attempt
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner />
          ) : !quizzes?.length ? (
            <EmptyState
              icon={<BookOpen className="size-5" />}
              title="No quizzes available"
              description="No published quizzes are currently available. Check back later."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {quizzes.map((quiz) => {
                const resultId = resultByQuiz.get(quiz._id);
                const attempted = resultId !== undefined;
                return (
                  <Card key={quiz._id} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {quiz.title}
                        </CardTitle>
                        <StatusBadge
                          status={attempted ? "Attempted" : quiz.status}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Hash className="size-3.5" />
                          {quiz.totalMarks} marks
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {quiz.duration} min
                        </span>
                      </div>
                      {attempted ? (
                        <Link
                          to={`/student/result/${resultId}`}
                          className="block"
                        >
                          <Button variant="outline" className="w-full gap-1.5">
                            <Eye className="size-3.5" />
                            View Result
                          </Button>
                        </Link>
                      ) : (
                        <Link
                          to={`/student/quiz/${quiz._id}`}
                          className="block"
                        >
                          <Button className="w-full gap-1.5">
                            <Play className="size-3.5" />
                            Start Quiz
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
