import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

export default function AdminCreateQuiz() {
  const navigate = useNavigate();
  const createQuiz = useMutation(api.quizzes.createQuiz);

  const [title, setTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [duration, setDuration] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const marksNum = parseInt(totalMarks, 10);
      const durationNum = parseInt(duration, 10);

      if (isNaN(marksNum) || marksNum <= 0) {
        throw new Error("Total marks must be a positive number.");
      }
      if (isNaN(durationNum) || durationNum <= 0) {
        throw new Error("Duration must be a positive number.");
      }

      const quizId = await createQuiz({
        title: title.trim(),
        totalMarks: marksNum,
        duration: durationNum,
      });

      toast.success("Quiz created successfully.");
      navigate(`/admin/quizzes/${quizId}/questions`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create quiz.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Link
            to="/admin/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Create New Quiz</CardTitle>
              <CardDescription>
                Fill in the details below to create a new quiz
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Java Programming Basics"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duration (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    placeholder="e.g. 30"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
                <Link to="/admin/dashboard">
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
