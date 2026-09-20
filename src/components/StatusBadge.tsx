import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Created: "bg-muted text-muted-foreground",
  Published:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  InProgress:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  Completed:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  Evaluated: "bg-primary/10 text-primary border-primary/20",
  Attempted: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
