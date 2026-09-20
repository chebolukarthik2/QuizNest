import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

type QuestionData = {
  _id: Id<"questions">;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
};

export default function AdminQuestions() {
  const { quizId } = useParams<{ quizId: string }>();

  const quiz = useQuery(
    api.quizzes.getQuiz,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );
  const questions = useQuery(
    api.quizzes.getQuizQuestionsForAdmin,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );

  const addQuestion = useMutation(api.questions.addQuestion);
  const updateQuestion = useMutation(api.questions.updateQuestion);
  const deleteQuestion = useMutation(api.questions.deleteQuestion);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<
    "A" | "B" | "C" | "D"
  >("A");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (q: QuestionData) => {
    setEditingId(q._id);
    setQuestionText(q.questionText);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectAnswer(q.correctAnswer);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await updateQuestion({
          questionId: editingId as Id<"questions">,
          questionText: questionText.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctAnswer,
        });
        toast.success("Question updated successfully.");
      } else {
        await addQuestion({
          quizId: quizId as Id<"quizzes">,
          questionText: questionText.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctAnswer,
        });
        toast.success("Question added successfully.");
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save question.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion({ questionId: questionId as Id<"questions"> });
      toast.success("Question deleted successfully.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete question.",
      );
    }
  };

  const isLoading = quiz === undefined || questions === undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

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

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {quiz?.title ?? "Quiz"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage questions • {questions?.length ?? 0} question(s)
              </p>
            </div>
            {!showForm && (
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Add Question
              </Button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="shadow-sm mb-6">
              <CardHeader>
                <CardTitle className="text-base">
                  {editingId ? "Edit Question" : "Add New Question"}
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="questionText">Question Text</Label>
                    <Input
                      id="questionText"
                      placeholder="Enter the question"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="optionA">Option A</Label>
                      <Input
                        id="optionA"
                        placeholder="Option A"
                        value={optionA}
                        onChange={(e) => setOptionA(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionB">Option B</Label>
                      <Input
                        id="optionB"
                        placeholder="Option B"
                        value={optionB}
                        onChange={(e) => setOptionB(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionC">Option C</Label>
                      <Input
                        id="optionC"
                        placeholder="Option C"
                        value={optionC}
                        onChange={(e) => setOptionC(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="optionD">Option D</Label>
                      <Input
                        id="optionD"
                        placeholder="Option D"
                        value={optionD}
                        onChange={(e) => setOptionD(e.target.value)}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select
                      value={correctAnswer}
                      onValueChange={(v) =>
                        setCorrectAnswer(v as "A" | "B" | "C" | "D")
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>

                <div className="px-6 pb-6 flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {editingId ? "Update Question" : "Add Question"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Questions List */}
          {!questions?.length && !showForm ? (
            <EmptyState
              title="No questions have been added yet"
              description="Click 'Add Question' to create the first question for this quiz."
            />
          ) : (
            <div className="space-y-3">
              {questions?.map((q, idx) => (
                <Card key={q._id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <p className="font-medium text-sm text-foreground">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs ml-8">
                          {(["A", "B", "C", "D"] as const).map((opt) => (
                            <div
                              key={opt}
                              className={`rounded px-2 py-1 ${
                                opt === q.correctAnswer
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {opt}. {q[`option${opt}` as keyof typeof q] as string}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(q)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(q._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
