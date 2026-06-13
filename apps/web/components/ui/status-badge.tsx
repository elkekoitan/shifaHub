import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "primary" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success border-success-border",
  warning: "bg-warning-bg text-warning border-warning-border",
  danger: "bg-destructive-bg text-destructive border-destructive-border",
  info: "bg-info-bg text-info border-info-border",
  primary: "bg-accent text-primary border-primary/20",
  neutral: "bg-muted text-text-2 border-border",
};

/**
 * Semantic status chip — colour + icon + label (never colour alone, WCAG 1.4.1).
 * Text uses the darker shade of the same family on a light tint background.
 */
export function StatusBadge({
  tone = "neutral",
  icon: Icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden /> : null}
      {children}
    </span>
  );
}
