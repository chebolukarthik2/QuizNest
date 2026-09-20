import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardCheck, Zap, CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

const features = [
  {
    icon: ClipboardCheck,
    title: "Create Quizzes",
    description:
      "Admins build quizzes with custom titles, marks, and duration — then publish when ready.",
  },
  {
    icon: CheckCircle2,
    title: "Take Quizzes",
    description:
      "Students browse published quizzes, answer questions, and submit with a clean interface.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description:
      "Automatic evaluation with immediate score, grade, and detailed answer review.",
  },
];

export default function Landing() {
  const { isAuthenticated, role } = useAuth();

  const dashboardLink =
    role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-flex size-4 items-center justify-center rounded bg-primary text-primary-foreground text-[10px] font-bold">
              Q
            </span>
            QuizNest
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Assess Smarter.{" "}
            <span className="text-primary">Perform Better.</span>
          </h1>

          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Create quizzes, take assessments, and receive instant results — all in
            one clean, focused platform.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={dashboardLink}>
                <Button size="lg" className="px-8">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="lg" className="px-8">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="px-8">
                    Register as Student
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-foreground mb-10">
            Everything you need
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6">
        <p className="text-center text-xs text-muted-foreground">
          QuizNest — Assess Smarter. Perform Better.
        </p>
      </footer>
    </div>
  );
}
