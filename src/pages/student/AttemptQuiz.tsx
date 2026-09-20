import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuizScene } from "@/components/QuizScene";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, ChevronDown, Clock, Send } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type Answer = "A" | "B" | "C" | "D";

type QuizShape = Doc<"quizzes">;

type QuestionShape = {
  _id: Id<"questions">;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

/**
 * Memoised so that scrolling (which re-renders this page to drive the 3D
 * scene) never re-creates the question cards or disturbs the radio inputs.
 */
const QuestionCard = memo(function QuestionCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: QuestionShape;
  index: number;
  selected?: Answer;
  onSelect: (questionId: string, value: Answer) => void;
}) {
  return (
    <Card className="shadow-lg bg-card border-border/50">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
            {index + 1}
          </span>
          <p className="flex-1 text-foreground leading-relaxed text-[15px]">
            {question.questionText}
          </p>
          {selected && <CheckCircle2 className="size-5 text-primary shrink-0" />}
        </div>

        <RadioGroup
          value={selected || ""}
          onValueChange={(value) => onSelect(question._id, value as Answer)}
          className="space-y-3 sm:ml-11"
        >
          {(["A", "B", "C", "D"] as const).map((opt) => {
            const optionText = question[
              `option${opt}` as keyof QuestionShape
            ] as string;
            return (
              <label
                key={opt}
                className={`flex items-start gap-3 rounded-lg border-2 p-3.5 cursor-pointer transition-all duration-150 ${
                  selected === opt
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-muted/50 hover:border-border/80"
                }`}
              >
                <RadioGroupItem value={opt} className="mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-sm text-muted-foreground mr-2">
                    {opt}.
                  </span>
                  <span className="text-sm text-foreground">{optionText}</span>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
});

/**
 * The quiz screen. It mounts only once the quiz, its questions and the
 * student's attempt history have all loaded, so the countdown starts from real
 * data on mount rather than being patched up by an effect.
 */
function QuizRunner({
  quizId,
  quiz,
  questions,
}: {
  quizId: Id<"quizzes">;
  quiz: QuizShape;
  questions: QuestionShape[];
}) {
  const navigate = useNavigate();
  const submitQuiz = useMutation(api.results.submitQuiz);

  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => quiz.duration * 60);

  // Scroll state: drives the 3D scene and the "currently viewing" label.
  const mainRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoSubmittedRef = useRef(false);

  const totalQuestions = questions.length;

  /**
   * One scroll listener drives two things:
   *  1. the overall progress passed to the Three.js scene
   *  2. a per-card depth transform, written straight to the DOM so that
   *     scrolling never re-renders the question cards themselves.
   */
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;

      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setScrollProgress(progress);

      const cards =
        mainRef.current?.querySelectorAll<HTMLElement>("[data-question-card]");
      if (!cards || cards.length === 0) return;

      // Cards fill the viewport on phones, so keep their travel gentler there.
      const swing = window.innerWidth < 768 ? 0.55 : 1;
      const centre = window.innerHeight / 2;
      let nearest = 0;
      let nearestDistance = Infinity;

      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - centre;
        const normalised = offset / window.innerHeight;
        const distance = Math.min(Math.abs(normalised), 1);

        if (Math.abs(offset) < nearestDistance) {
          nearestDistance = Math.abs(offset);
          nearest = index;
        }

        // Questions away from the centre sit slightly back in depth.
        card.style.opacity = String(1 - distance * 0.18 * swing);
        card.style.transform = `perspective(1400px) translateY(${
          normalised * 14 * swing
        }px) rotateX(${normalised * -2.4 * swing}deg) scale(${
          1 - distance * 0.012
        })`;
      });

      setActiveIndex(nearest);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [totalQuestions]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const answerArray = questions.map((q) => ({
        questionId: q._id,
        // Unanswered questions are submitted as blank, never as an option.
        selectedAnswer: answers[q._id] ?? ("" as const),
      }));

      const resultId = await submitQuiz({ quizId, answers: answerArray });

      toast.success("Quiz submitted successfully!");
      navigate(`/student/result/${resultId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit quiz");
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    questions,
    quizId,
    answers,
    submitQuiz,
    navigate,
  ]);

  const timerRunning = timeLeft > 0 && !isSubmitting;

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Auto-submit exactly once when the countdown reaches zero.
  useEffect(() => {
    if (timeLeft === 0 && !isSubmitting && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      void handleSubmit();
    }
  }, [timeLeft, isSubmitting, handleSubmit]);

  const handleAnswer = useCallback((questionId: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const viewingQuestion = Math.min(activeIndex + 1, totalQuestions);
  const timerLow = timeLeft < 60;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* 3D background — reacts to how far the student has scrolled */}
      <QuizScene progress={scrollProgress} />

      {/* Quiz bar: title, position, timer, answered count */}
      <div className="sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-foreground truncate">
              {quiz.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Viewing question {viewingQuestion} of {totalQuestions} •{" "}
              {quiz.totalMarks} marks
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-1.5 text-sm font-mono font-semibold rounded-md px-2.5 py-1 ${
                timerLow
                  ? "text-destructive bg-destructive/10"
                  : "text-foreground bg-muted"
              }`}
            >
              <Clock className="size-3.5" />
              {formatTime(timeLeft)}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* ALL questions on ONE continuous page — scroll straight down */}
      <main ref={mainRef} className="relative z-10 flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ChevronDown className="size-3.5 animate-bounce" />
            Answer each question as you scroll — submit at the bottom
          </div>

          {questions.map((question, idx) => (
            <div
              key={question._id}
              data-question-card
              style={{ transformOrigin: "center center" }}
            >
              <QuestionCard
                question={question}
                index={idx}
                selected={answers[question._id]}
                onSelect={handleAnswer}
              />
            </div>
          ))}

          {/* Submit section — the very bottom of the page */}
          <div className="pt-4 pb-12">
            <Card className="shadow-lg bg-card border-border/50">
              <CardContent className="p-6 text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Ready to submit?
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {answeredCount === totalQuestions
                      ? `You answered all ${totalQuestions} questions.`
                      : `You answered ${answeredCount} of ${totalQuestions} questions.`}
                  </p>
                  {answeredCount < totalQuestions && (
                    <p className="mt-2 text-xs text-amber-600">
                      {totalQuestions - answeredCount} unanswered question(s)
                      will be marked as incorrect.
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={isSubmitting}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 px-8"
                  size="lg"
                >
                  <Send className="size-4" />
                  Submit Quiz
                </Button>

                <p className="text-[11px] text-muted-foreground">
                  Scroll back up at any time to change an answer.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Submit Quiz?
              </h3>
              <p className="text-sm text-muted-foreground">
                You have answered {answeredCount} of {totalQuestions} questions.
                {answeredCount < totalQuestions && (
                  <span className="block mt-1.5 text-amber-600 font-medium">
                    {totalQuestions - answeredCount} unanswered question(s) will
                    be marked as incorrect.
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                Once submitted, you cannot change your answers.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                >
                  Continue
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function StudentAttemptQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const ensureProfile = useMutation(api.users.ensureStudentProfile);

  const quiz = useQuery(
    api.quizzes.getQuiz,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );
  const questions = useQuery(
    api.quizzes.getQuizQuestions,
    quizId ? { quizId: quizId as Id<"quizzes"> } : "skip",
  );
  const myResults = useQuery(api.results.getStudentResults, {});

  // Safety net: make sure the signed-in student has a profile row. submitQuiz
  // also creates one on demand, so a missing profile can never block a submit.
  useEffect(() => {
    ensureProfile().catch(() => {
      /* non-critical */
    });
  }, [ensureProfile]);

  if (
    quiz === undefined ||
    questions === undefined ||
    myResults === undefined
  ) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // A quiz can only be attempted once — send the student to their result
  // instead of letting them answer a quiz that would be rejected on submit.
  const existingResult = quizId
    ? myResults.find((r) => r.quizId === quizId)
    : undefined;

  if (existingResult) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  You have already attempted this quiz
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each quiz can be submitted once. Your score and answers are
                  stored in the result.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link to={`/student/result/${existingResult._id}`}>
                  <Button className="w-full sm:w-auto">View Result</Button>
                </Link>
                <Link to="/student/quizzes">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Back to Quizzes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!quizId || !quiz || !questions?.length) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {quiz ? "No questions found for this quiz." : "Quiz not found."}
            </p>
            <Link to="/student/quizzes">
              <Button variant="outline">Back to Quizzes</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuizRunner
      key={quizId}
      quizId={quizId as Id<"quizzes">}
      quiz={quiz}
      questions={questions}
    />
  );
}
