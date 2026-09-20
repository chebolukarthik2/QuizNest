import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const RegisterPage = lazy(() => import("./pages/Register.tsx"));
const SeedPage = lazy(() => import("./pages/Seed.tsx"));
const StudentDashboard = lazy(() => import("./pages/student/Dashboard.tsx"));
const StudentQuizzes = lazy(() => import("./pages/student/Quizzes.tsx"));
const StudentAttemptQuiz = lazy(
  () => import("./pages/student/AttemptQuiz.tsx"),
);
const StudentResult = lazy(() => import("./pages/student/Result.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const AdminCreateQuiz = lazy(() => import("./pages/admin/CreateQuiz.tsx"));
const AdminQuestions = lazy(
  () => import("./pages/admin/ManageQuestions.tsx"),
);
const AdminPublishQuiz = lazy(
  () => import("./pages/admin/PublishQuiz.tsx"),
);
const AdminResults = lazy(() => import("./pages/admin/Results.tsx"));
const ProfilePage = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Root] Runtime error:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string,
);

// Apply theme class immediately before render to prevent flicker
const storedTheme = localStorage.getItem("quiznest-theme") || "light";
document.documentElement.classList.add(storedTheme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <ThemeProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/seed" element={<SeedPage />} />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <ProfilePage />
                    </RequireAuth>
                  }
                />

                {/* Student routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <RequireAuth requiredRole="student">
                      <StudentDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/student/quizzes"
                  element={
                    <RequireAuth requiredRole="student">
                      <StudentQuizzes />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/student/quiz/:quizId"
                  element={
                    <RequireAuth requiredRole="student">
                      <StudentAttemptQuiz />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/student/result/:resultId"
                  element={
                    <RequireAuth requiredRole="student">
                      <StudentResult />
                    </RequireAuth>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <RequireAuth requiredRole="admin">
                      <AdminDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/quizzes/create"
                  element={
                    <RequireAuth requiredRole="admin">
                      <AdminCreateQuiz />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/quizzes/:quizId/questions"
                  element={
                    <RequireAuth requiredRole="admin">
                      <AdminQuestions />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/quizzes/publish"
                  element={
                    <RequireAuth requiredRole="admin">
                      <AdminPublishQuiz />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin/results"
                  element={
                    <RequireAuth requiredRole="admin">
                      <AdminResults />
                    </RequireAuth>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster />
        </ThemeProvider>
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
