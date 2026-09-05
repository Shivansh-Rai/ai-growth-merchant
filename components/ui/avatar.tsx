import { cn } from "@/lib/utils";

export interface AvatarProps {
  name: string;
  size?: "sm" | "md";
  className?: string;
}

/** Derives up to two initials from a display name. */
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Initials avatar. Deliberately monochrome — customer identity should not
 * introduce arbitrary colour into a restrained palette.
 */
export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "border border-line bg-surface-muted font-semibold text-ink-muted",
        size === "sm" ? "size-7 text-[11px]" : "size-8 text-xs",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
