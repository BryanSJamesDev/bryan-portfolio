"use client";
/* Cursor dust — ambient motes that drift off the pointer.
 *
 * Adapted from the "cursor spray" in ThreeUI's Sylva "Living Green" hero
 * (public/landing-pages/inner-green-3d.html, rev 05f359ce157a, canonical
 * SHA-256 69c3694b…). In the source it is `buildCursorSpray()` / `emitSpray()`:
 * a THREE.Points system (~620 particles) whose flight is integrated in a GLSL
 * vertex shader and additively blended into the WebGL scene, emitting grains by
 * DISTANCE along the segment the pointer covered since the last frame.
 *
 * This project already runs three persistent WebGL contexts (the heading
 * grain-reveal, the pill liquid-metal shader, the scroll particle field), so a
 * fourth GPU context left running for cursor dust is exactly what to avoid.
 * This port keeps the authored BEHAVIOUR — distance-based emission, per-grain
 * origin/velocity/birth, drag + slow lift + wander, the soft radial sprite, the
 * fade envelope — on a plain Canvas 2D surface with a small fixed pool. The rAF
 * loop only runs while grains are alive or the pointer has just moved; when the
 * page is still it stops entirely, so at rest this costs nothing.
 *
 * Guardrails:
 *  - prefers-reduced-motion  -> nothing mounts, no listeners, no canvas paint.
 *  - not (hover: hover) and (pointer: fine)  -> touch / coarse pointers get
 *    nothing; there is no cursor to trail. Same gate topDockController uses.
 *  - the canvas is pointer-events:none and sits at z-index 0, behind the
 *    reading content (main is lifted to z-index 1 in globals.css).
 */
import { useEffect, useRef } from "react";

const LIFE = 1.5; // seconds a grain lives
const POOL = 100; // hard cap on simultaneous grains
const EMIT_STEP = 21; // px of pointer travel per grain laid along the path
const EMIT_MAX = 4; // grains per move event, so a fast flick can't dump a clump
const IDLE_TRICKLE = 0.13; // s between grains while the pointer rests but is live
const IDLE_LINGER = 0.24; // s after the last move that the trickle keeps going
const PEAK_ALPHA_DARK = 0.36; // additive glow on the dark olive ground
const PEAK_ALPHA_LIGHT = 0.2; // plain paint on the light ground

type Grain = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  birth: number;
  size: number;
  phase: number;
  seed: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** pale warm green on the dark olive ground; a soft olive-grey on the light one */
function dustRGB(): [number, number, number] {
  if (typeof document !== "undefined") {
    const dark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    return dark ? [236, 244, 224] : [92, 96, 82];
  }
  return [236, 244, 224];
}

function makeSprite(rgb: [number, number, number]) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  const [r, gr, b] = rgb;
  grad.addColorStop(0, `rgba(${r},${gr},${b},0.95)`);
  grad.addColorStop(0.35, `rgba(${r},${gr},${b},0.5)`);
  grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

export function CursorDust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const precise = matchMedia("(hover: hover) and (pointer: fine)");

    let ctx: CanvasRenderingContext2D | null = null;
    let sprite: HTMLCanvasElement | null = null;
    let additive = false;
    const grains: Grain[] = [];
    let head = 0;
    let raf = 0;
    let running = false;
    let t0 = performance.now();
    let now = 0;
    let prevNow = 0;

    // pointer trail state
    let live = false;
    let lastMove = -999;
    let px = 0;
    let py = 0;
    let haveLast = false;
    let lastX = 0;
    let lastY = 0;
    let trickleAcc = 0;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const refreshTheme = () => {
      const rgb = dustRGB();
      sprite = makeSprite(rgb);
      // additive reads as a glow on the dark ground; on the light ground it
      // would be invisible, so there we just paint the tinted sprite normally.
      additive =
        document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
          matchMedia("(prefers-color-scheme: dark)").matches);
    };

    const spawn = (x: number, y: number) => {
      const g = grains[head] ?? ({} as Grain);
      g.x = x + rand(-2, 2);
      g.y = y + rand(-2, 2);
      g.vx = rand(-26, 26);
      g.vy = rand(-46, -8); // upward (canvas +y is down)
      g.birth = now;
      g.size = rand(1.2, 2.7);
      g.phase = Math.random() * Math.PI * 2;
      g.seed = Math.random();
      grains[head] = g;
      head = (head + 1) % POOL;
    };

    const ensureRunning = () => {
      if (running) return;
      running = true;
      prevNow = (performance.now() - t0) / 1000;
      raf = requestAnimationFrame(frame);
    };

    const frame = (ts: number) => {
      now = (ts - t0) / 1000;
      const dt = Math.min(0.05, Math.max(0, now - prevNow));
      prevNow = now;
      if (!ctx) {
        running = false;
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = additive ? "lighter" : "source-over";

      let alive = 0;
      for (const g of grains) {
        if (!g || g.birth < 0) continue;
        const age = now - g.birth;
        if (age < 0 || age > LIFE) continue;
        const u = age / LIFE;
        const drag = 1 - 0.34 * u;
        const x = g.x + g.vx * age * drag + Math.sin(g.phase + age * 2.6) * 13 * u;
        const y = g.y + g.vy * age * drag - 24 * age * u;
        const peak = additive ? PEAK_ALPHA_DARK : PEAK_ALPHA_LIGHT;
        const a = smoothstep(0, 0.1, u) * (1 - smoothstep(0.42, 1, u)) * peak;
        if (a <= 0.002) continue;
        const r = g.size * (0.45 + 0.55 * (1 - u)) * 3;
        ctx.globalAlpha = a;
        if (sprite) ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
        alive++;
      }
      ctx.globalAlpha = 1;

      const trickling = live && now - lastMove < IDLE_LINGER;
      if (trickling) {
        trickleAcc += dt;
        while (trickleAcc >= IDLE_TRICKLE) {
          trickleAcc -= IDLE_TRICKLE;
          spawn(px, py);
        }
      } else {
        trickleAcc = 0;
      }

      if (alive > 0 || trickling) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      now = (performance.now() - t0) / 1000; // keep the clock fresh between loop stops
      px = e.clientX;
      py = e.clientY;
      lastMove = now;
      live = true;
      if (!haveLast) {
        haveLast = true;
        lastX = px;
        lastY = py;
        ensureRunning();
        return;
      }
      const dx = px - lastX;
      const dy = py - lastY;
      const d = Math.hypot(dx, dy);
      const n = Math.min(EMIT_MAX, Math.floor(d / EMIT_STEP));
      for (let k = 1; k <= n; k++) {
        spawn(lastX + (dx * k) / n, lastY + (dy * k) / n);
      }
      if (n > 0) {
        lastX = px;
        lastY = py;
      }
      ensureRunning();
    };

    const onLeave = () => {
      live = false;
      haveLast = false;
    };

    let attached = false;
    const attach = () => {
      if (attached || reduced.matches || !precise.matches) return;
      attached = true;
      ctx = canvas.getContext("2d");
      t0 = performance.now();
      resize();
      refreshTheme();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", resize);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      schemeQuery.addEventListener("change", refreshTheme);
    };
    const detach = () => {
      attached = false;
      cancelAnimationFrame(raf);
      running = false;
      grains.length = 0;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      themeObserver.disconnect();
      schemeQuery.removeEventListener("change", refreshTheme);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx = null;
    };

    const themeObserver = new MutationObserver(refreshTheme);
    const schemeQuery = matchMedia("(prefers-color-scheme: dark)");
    const onGateChange = () => {
      if (reduced.matches || !precise.matches) detach();
      else attach();
    };
    reduced.addEventListener("change", onGateChange);
    precise.addEventListener("change", onGateChange);

    attach();

    return () => {
      reduced.removeEventListener("change", onGateChange);
      precise.removeEventListener("change", onGateChange);
      detach();
    };
  }, []);

  return <canvas ref={ref} className="cursor-dust" aria-hidden="true" />;
}
