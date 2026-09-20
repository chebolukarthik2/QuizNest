import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

interface StepStatus {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}

const DEMO_ADMIN = { email: "admin@oqms.demo", password: "Admin@123" };
const DEMO_STUDENT = { email: "student@oqms.demo", password: "Student@123" };

export default function SeedPage() {
  const { signIn, signOut } = useAuth();
  const createStudentProfile = useMutation(api.users.createStudentProfile);
  const createAdminProfile = useMutation(api.users.createAdminProfile);
  const seedDemoQuiz = useMutation(api.seed.seedDemoQuiz);

  const [steps, setSteps] = useState<StepStatus[]>([
    { label: "Create demo admin account", status: "pending" },
    { label: "Create demo student account", status: "pending" },
    { label: "Seed demo quiz with 10 questions", status: "pending" },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const updateStep = (
    i: number,
    status: StepStatus["status"],
    detail?: string,
  ) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, status, detail } : s)),
    );
  };

  /**
   * Create the account if it does not exist yet, otherwise sign in.
   * Either way we end up authenticated, which is required before the
   * profile mutations can run.
   */
  const ensureSignedIn = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "admin",
  ) => {
    try {
      const signUp = new FormData();
      signUp.set("email", email);
      signUp.set("password", password);
      signUp.set("name", name);
      signUp.set("role", role);
      signUp.set("flow", "signUp");
      await signIn("password", signUp);
      return "created";
    } catch {
      // Account already exists (or sign-up failed) — try a normal sign-in.
      const signInData = new FormData();
      signInData.set("email", email);
      signInData.set("password", password);
      signInData.set("flow", "signIn");
      await signIn("password", signInData);
      return "existing";
    }
  };

  const runSeed = async () => {
    setIsRunning(true);

    // Step 1: admin account + profile
    updateStep(0, "active");
    try {
      await ensureSignedIn(
        DEMO_ADMIN.email,
        DEMO_ADMIN.password,
        "Demo Admin",
        "admin",
      );
      await createAdminProfile({
        department: "Computer Science and Engineering",
      });
      updateStep(0, "done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(0, "error", msg.slice(0, 140));
    }
    try {
      await signOut();
    } catch {
      /* ignore */
    }

    // Step 2: student account + profile
    updateStep(1, "active");
    try {
      await ensureSignedIn(
        DEMO_STUDENT.email,
        DEMO_STUDENT.password,
        "Demo Student",
        "student",
      );
      await createStudentProfile({
        course: "Computer Science and Engineering",
        semester: "5",
      });
      updateStep(1, "done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(1, "error", msg.slice(0, 140));
    }
    try {
      await signOut();
    } catch {
      /* ignore */
    }

    // Step 3: demo quiz (needs an admin session)
    updateStep(2, "active");
    try {
      const adminLogin = new FormData();
      adminLogin.set("email", DEMO_ADMIN.email);
      adminLogin.set("password", DEMO_ADMIN.password);
      adminLogin.set("flow", "signIn");
      await signIn("password", adminLogin);
      await seedDemoQuiz();
      updateStep(2, "done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("already")) {
        updateStep(2, "done", "Already seeded");
      } else {
        updateStep(2, "error", msg.slice(0, 140));
      }
    }
    try {
      await signOut();
    } catch {
      /* ignore */
    }

    setIsDone(true);
    setIsRunning(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Setup QuizNest</CardTitle>
          <CardDescription>
            Create the demo accounts and sample data. Safe to run again — it
            repairs anything that is missing.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <div className="mt-0.5 shrink-0">
                {step.status === "done" && (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
                {step.status === "active" && (
                  <Loader2 className="size-4 text-primary animate-spin" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="size-4 text-destructive" />
                )}
                {step.status === "pending" && (
                  <span className="block size-2 rounded-full bg-muted-foreground/30 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.label}</p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5 break-words">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {!isDone ? (
            <Button onClick={runSeed} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Create Demo Accounts & Seed Data"
              )}
            </Button>
          ) : (
            <Link to="/login" className="w-full">
              <Button className="w-full gap-2">
                Go to Login <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
