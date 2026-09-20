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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

function Register() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const createStudentProfile = useMutation(api.users.createStudentProfile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/student/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create auth user via Convex Auth Password provider
      const signUpData = new FormData();
      signUpData.set("email", email);
      signUpData.set("password", password);
      signUpData.set("name", name);
      signUpData.set("role", "student");
      signUpData.set("flow", "signUp");
      await signIn("password", signUpData);

      // Step 2: Create student profile (idempotent - safe to call even if exists)
      await createStudentProfile({ course, semester });
      navigate("/student/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already") || msg.includes("exist")) {
        // User already exists — try to create profile anyway in case it was missing
        try {
          await createStudentProfile({ course, semester });
          navigate("/student/dashboard");
          return;
        } catch {
          setError("An account with this email already exists. Please sign in.");
        }
      } else if (msg.length > 200) {
        setError("Registration failed. Please try again.");
      } else {
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              Q
            </div>
            <span className="text-lg font-semibold tracking-tight">QuizNest</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Student Registration</CardTitle>
            <CardDescription>
              Create your account to start taking quizzes
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  placeholder="e.g. Computer Science and Engineering"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={semester}
                  onValueChange={setSemester}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        Semester {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !semester}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <Register />
    </Suspense>
  );
}
