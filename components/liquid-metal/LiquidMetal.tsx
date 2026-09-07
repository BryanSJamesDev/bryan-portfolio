"use client";
/* Liquid-metal control (ThreeUI Sylva "Living Green" hero, rev 05f359ce157a).
 *
 * At rest each control is a plain CSS pill — no canvas, no GL context, and the
 * ~7 KB shader module is not even downloaded. The five-pass WebGL2 renderer
 * (./liquidMetalRenderer.ts, vendored from the exact source) is dynamically
 * imported and mounted the first time a control is hovered or keyboard-focused,
 * and torn down ~1.2 s after the pointer leaves. However many of these are on
 * the page, at most one or two hold a live context at a time.
 *
 * - no WebGL2  -> the shader never mounts; hover shows the CSS shimmer instead.
 * - prefers-reduced-motion -> nothing mounts, ever; the static pill is the whole
 *   treatment.
 * - the real element is a genuine <a href> / <button>, so navigation and form
 *   submission never depend on the decorative layer.
 */
import {
  useEffect,
  useRef,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { LiquidMetalHandle, LiquidMetalTune } from "./liquidMetalRenderer";

const TEARDOWN_MS = 1200;
// the authored brightness blows out a small pill's label; the icon-only circle
// has nothing to protect, so it keeps more of the shipped punch.
const TUNE: Record<"explore" | "play", LiquidMetalTune> = {
  explore: { gain: 1.35, dim: 0.24, glow: 1.2, glowR: 1.05, punch: 1.3 },
  play: { gain: 1.55, dim: 0.4, glow: 1.4 },
};
const prefersReducedMotion = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

type Want = {
  mode: "hover" | "focus";
  coords?: { x: number; y: number };
  press?: boolean;
};
const apply = (h: LiquidMetalHandle, w: Want) => {
  if (w.mode === "hover") h.hover(true);
  else h.focus(true);
  if (w.coords) h.setPointer(w.coords.x, w.coords.y);
  if (w.press) h.press(true);
};

type Base = {
  label: string;
  variant?: "pill" | "circle";
  icon?: ReactNode;
  ariaLabel?: string;
  className?: string;
};
type LinkProps = Base & { as?: "a"; href: string; external?: boolean };
type ButtonProps = Base & {
  as: "button";
  type?: "button" | "submit";
  onClick?: () => void;
};
export type LiquidMetalProps = LinkProps | ButtonProps;

export function LiquidMetal(props: LiquidMetalProps) {
  const { label, variant = "pill", icon, ariaLabel, className } = props;
  const glVariant = variant === "circle" ? "play" : "explore";
  const slotRef = useRef<HTMLSpanElement>(null);
  const handleRef = useRef<LiquidMetalHandle | null>(null);
  const wantRef = useRef<Want | null>(null); // non-null between arm() and disarm()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const arm = (want: Want) => {
    clearTimer();
    const slot = slotRef.current;
    if (!slot || prefersReducedMotion()) return;
    wantRef.current = want;
    if (handleRef.current) {
      apply(handleRef.current, want);
      return;
    }
    slot.classList.add("lm-armed");
    import("./liquidMetalRenderer").then(({ mountLiquidMetal }) => {
      const w = wantRef.current;
      if (!w || handleRef.current || !slotRef.current) return; // disarmed or already up
      let handle: LiquidMetalHandle | null = null;
      try {
        handle = mountLiquidMetal(slotRef.current, glVariant, TUNE[glVariant]);
      } catch {
        handle = null;
      }
      if (!handle) {
        // no WebGL2 (or shader init threw) — fall back to the CSS shimmer
        slotRef.current.classList.remove("lm-armed");
        slotRef.current.classList.add("lm-shimmer");
        return;
      }
      handleRef.current = handle;
      apply(handle, w);
    });
  };

  const disarm = () => {
    clearTimer();
    wantRef.current = null; // cancels a still-loading mount
    timerRef.current = setTimeout(() => {
      handleRef.current?.destroy();
      handleRef.current = null;
      slotRef.current?.classList.remove("lm-armed", "lm-shimmer");
    }, TEARDOWN_MS);
  };

  useEffect(
    () => () => {
      clearTimer();
      wantRef.current = null;
      handleRef.current?.destroy();
      handleRef.current = null;
    },
    [],
  );

  const onPointerEnter = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse")
      arm({ mode: "hover", coords: { x: e.clientX, y: e.clientY } });
  };
  const onPointerLeave = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") disarm();
  };
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse") return;
    // touch / pen: light it and ripple, then let it settle back on its own
    arm({ mode: "hover", coords: { x: e.clientX, y: e.clientY }, press: true });
    clearTimer();
    timerRef.current = setTimeout(disarm, 2600);
  };
  const onFocus = (e: ReactFocusEvent) => {
    if ((e.target as HTMLElement).matches?.(":focus-visible"))
      arm({ mode: "focus" });
  };

  const inner = (
    <>
      {icon != null && (
        <span className="lm-ico" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="lm-lbl">{label}</span>
    </>
  );
  const btnClass = `liquid-button liquid-button--${glVariant}`;
  const name = ariaLabel ?? label;

  return (
    <span
      ref={slotRef}
      className={`lm-slot${className ? ` ${className}` : ""}`}
      data-liquid-metal={glVariant}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onFocusCapture={onFocus}
      onBlurCapture={disarm}
    >
      <span className="lm-plate" aria-hidden="true" />
      <span className="lm-fxwrap" aria-hidden="true">
        <canvas className="liquid-fx" aria-hidden="true" />
      </span>
      {props.as === "button" ? (
        <button
          className={btnClass}
          type={props.type ?? "button"}
          aria-label={name}
          onClick={props.onClick}
        >
          {inner}
        </button>
      ) : (
        <a
          className={btnClass}
          href={props.href}
          aria-label={name}
          {...(props.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : null)}
        >
          {inner}
        </a>
      )}
    </span>
  );
}
