export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
