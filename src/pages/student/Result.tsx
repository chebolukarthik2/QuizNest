import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { CheckCircle2, XCircle, ArrowLeft, Trophy } from "lucide-react";
import { Link, useParams } from "react-router";
import type { Id } from "@/convex/_generated/dataModel";

export default function StudentResult() {
  const { resultId } = useParams<{ resultId: string }>();

  const result = useQuery(
    api.results.getResult,
    resultId ? { resultId: resultId as Id<"results"> } : "skip",
  );

  const questions = useQuery(
    api.quizzes.getQuizQuestionsForResultReview,
    resultId ? { resultId: resultId as Id<"results"> } : "skip",
  );

  if (result === undefined || questions === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Result not found.</p>
        </div>
      </div>
    );
  }

  const percentage =
    result.totalQuestions > 0
      ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/student/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>

          {/* Score Card */}
          <Card className="shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Trophy className="size-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  {result.quiz?.title ?? "Quiz Result"}
                </h1>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {result.score}
                      <span className="text-lg text-muted-foreground font-normal">
                        /{result.quiz?.totalMarks}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Score</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {result.grade}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Grade</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {percentage}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <StatusBadge status={result.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.correctAnswers} correct out of{" "}
                  {result.totalQuestions} questions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Answer Review */}
          {questions && questions.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Answer Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.answers.map((answer, idx) => {
                  const question = questions.find(
                    (q) => q._id === answer.questionId,
                  );
                  if (!question) return null;

                  return (
                    <div
                      key={answer.questionId}
                      className={`rounded-lg border p-4 ${
                        answer.isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-red-500/40 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {answer.isCorrect ? (
                          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="size-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">
                            <span className="text-muted-foreground mr-1">
                              Q{idx + 1}.
                            </span>
                            {question.questionText}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p>
                              Your answer:{" "}
                              <span
                                className={
                                  answer.isCorrect
                                    ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                    : "text-red-700 dark:text-red-300 font-medium"
                                }
                              >
                                {answer.selectedAnswer || "No answer"}
                              </span>
                            </p>
                            {!answer.isCorrect && (
                              <p>
                                Correct answer:{" "}
                                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                  {question.correctAnswer}
                                </span>
                              </p>
                            )}
                          </div>
                          {/* Show all options */}
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {(["A", "B", "C", "D"] as const).map((opt) => {
                              const optText =
                                question[
                                  `option${opt}` as keyof typeof question
                                ];
                              const isCorrect = opt === question.correctAnswer;
                              const isSelected = opt === answer.selectedAnswer;
                              return (
                                <div
                                  key={opt}
                                  className={`rounded px-2 py-1 ${
                                    isCorrect
                                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-medium"
                                      : isSelected
                                        ? "bg-red-500/15 text-red-800 dark:text-red-300"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {opt}. {optText as string}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
