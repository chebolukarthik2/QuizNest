import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ThemeProvider";
import { LogOut, Menu, X, Moon, Sun, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function Header() {
  const { isAuthenticated, user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashboardLink =
    role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to={isAuthenticated ? dashboardLink : "/"}
          className="flex items-center gap-2.5"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            Q
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            QuizNest
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground mr-1">
                {user?.name || user?.email}
              </span>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                {role}
              </span>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <User className="size-3.5" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="size-3.5" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-9"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <button
            className="p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2">
          {isAuthenticated ? (
            <>
              <p className="text-sm text-muted-foreground">
                {user?.name || user?.email}
              </p>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5">
                  <User className="size-3.5" />
                  Profile
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-1.5"
              >
                <LogOut className="size-3.5" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
