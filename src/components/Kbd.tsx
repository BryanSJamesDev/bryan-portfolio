import { cn } from "../lib/utils";

export default function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "rounded-lg border px-2 py-1 text-xs",
        className
      )}
      style={{ borderColor: "rgb(var(--border))" }}
    >
      {children}
    </kbd>
  );
}
