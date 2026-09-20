import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary/20">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
