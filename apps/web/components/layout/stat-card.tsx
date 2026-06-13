import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "warning" | "success";
}) {
  const color =
    accent === "warning" ? "text-warning" : accent === "success" ? "text-success" : "text-primary";
  return (
    <div className="rounded-[var(--radius)] bg-muted p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-2">{label}</span>
        <Icon className={cn("size-4", color)} aria-hidden />
      </div>
      <div className="mt-1 text-2xl font-medium text-foreground">{value}</div>
    </div>
  );
}
