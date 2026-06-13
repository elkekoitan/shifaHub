import { cn } from "@/lib/utils";

/**
 * ShifaHub brand mark — a sprout rising inside a healing drop (şifa: growth +
 * water/hijama). Single-color glyph (`currentColor`); the caller provides the
 * surrounding tile color so it adapts to emerald-on-cream and cream-on-emerald.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6", className)}
      role="img"
      aria-label="ShifaHub"
    >
      <path
        d="M12 2.5C7.2 6.4 5 10.3 5 14a7 7 0 0 0 14 0c0-3.7-2.2-7.6-7-11.5Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M12 2.5C7.2 6.4 5 10.3 5 14a7 7 0 0 0 14 0c0-3.7-2.2-7.6-7-11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 20.5V9.5M12 13l3-2.3M12 16l-3-2.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
