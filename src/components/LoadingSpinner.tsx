import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-5";

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeClass)} />
    </div>
  );
}
