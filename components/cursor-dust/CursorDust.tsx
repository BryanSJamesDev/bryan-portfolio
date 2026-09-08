"use client";
/* Cursor dust — ambient motes that drift off the pointer.
 *
 * Adapted from the "cursor spray" in ThreeUI's Sylva "Living Green" hero
 * (public/landing-pages/inner-green-3d.html, rev 05f359ce157a, canonical
 * SHA-256 69c3694b…) — `buildCursorSpray()` / `emitSpray()` / `spawnSpray()`.
 * In the source it is a THREE.Points system whose flight is integrated in a
 * GLSL vertex shader and additively blended into the WebGL scene, emitting
 * grains by DISTANCE along the segment the pointer covered since the last frame.
 *
 * This project already runs three persistent WebGL contexts (heading grain-
 * reveal, liquid-metal pills, scroll particle field), so a fourth GPU context
 * idling for cursor dust is what to avoid. This is a Canvas 2D port that keeps
 * the authored numbers, not just the behaviour — every constant below is traced
 * to its line in the source and, where the source works in world units, scaled
 * to screen pixels by the one factor the projection applies (see WU / RADIUS_K).
 * The rAF loop runs only while grains are alive or the pointer just moved; at
 * rest it stops entirely.
 *
 * Guardrails:
 *  - prefers-reduced-motion  -> nothing mounts, no listeners, no paint.
 *  - not (hover: hover) and (pointer: fine)  -> touch / coarse pointers get
 *    nothing. Same gate the source uses (matchMedia('(hover:hover) and
 *    (pointer:fine)')) and topDockController uses.
 *  - canvas is pointer-events:none at z-index 0, behind the reading content
 *    (main is lifted to z-index 1 in globals.css).
 */
import { useEffect, useRef } from "react";

/* ── traced from the source ──────────────────────────────────────────────
   spawnSpray():  sprayVel = [rand(-38,38), rand(2,64), …]  (world units/s, +y up)
                  sprayPos += rand(-15,15) on x and y
   vertex shader: p = position + aVel*age*(1 - 0.34*u)
                    + vec3(sin(aRnd.y*6.28 + age*2.6) * 22.0 * u,  46.0*age,  0)
                  gl_PointSize = 13 * aRnd.x * (uScale / -mv.z) * (0.45 + 0.55*(1-u))
                  aRnd.x = rand(0.50, 1.15)
   fragment:      alpha = tex.a * vA * 0.85
                  vA = smoothstep(0,0.09,u) * (1 - smoothstep(0.40,1,u))
   emitSpray():   n = min(14, floor(distance / 7))   — 7 world units per grain
                  idle: spawn one every 0.055 s while the pointer rests
   SPRAY_LIFE = 1.6                                                        */
const LIFE = 1.6;
const DRAG = 0.34;
const EMIT_MAX = 14;
const IDLE_TRICKLE = 0.055;
const IDLE_LINGER = 0.24; // s the trickle keeps going after the last move
const POOL = 400;
const PEAK = 0.6; /* source uses 0.85 additively, but into an ACES-tonemapped,
                     bloomed scene that rolls off the highlights; on a flat 2D
                     canvas 0.85 blows overlapping grains to white, so it is
                     pulled down until a trail reads as grain, not paste. */

/* world unit -> screen px at the spray plane. The plane sits at z = 240
   (THREE.Plane((0,0,1), -240)); the camera at z = DIST = 1400. A perspective
   camera magnifies things nearer than its target by DIST / (DIST - zplane). */
const WU = 1400 / (1400 - 240); // ≈ 1.207
const JITTER = 15 * WU;
const VX = 38 * WU;
const VY_MIN = 2 * WU;
const VY_MAX = 64 * WU;
const LIFT = 46 * WU; // the vertex shader's extra upward drift, + 46.0*age
const WANDER = 22 * WU; // sin(...) * 22.0 * u
const EMIT_STEP = 7 * WU; // one grain per 7 world units of pointer travel

type Grain = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  birth: number;
  size: number; // birth radius in css px (already includes aRnd.x)
  phase: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/* the source sprite: a small warm-white core bleeding to a cream edge (recoloured
   from the reference's pale-green to sit in the aged-paper palette — same radial
   sprite, same physics). Original stops: 0 rgba(255,255,255,1),
   0.35 rgba(236,244,224,0.5), 1 rgba(236,244,224,0). */
function makeSprite() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, "rgba(249,241,222,1)");
  grad.addColorStop(0.35, "rgba(224,204,158,0.5)");
  grad.addColorStop(1, "rgba(224,204,158,0)");
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
    const grains: Grain[] = [];
    let head = 0;
    let raf = 0;
    let running = false;
    let t0 = performance.now();
    let now = 0;
    let prevNow = 0;

    let live = false;
    let lastMove = -999;
    let px = 0;
    let py = 0;
    let haveLast = false;
    let lastX = 0;
    let lastY = 0;
    let trickleAcc = 0;

    /* gl_PointSize in css-px DIAMETER = 13 * aRnd.x * (uScale / -mv.z) * fade,
       with uScale = drawingBufferHeight/2 = innerHeight*pr/2 and -mv.z ≈ 1160.
       Divide by pr for css px: 13 * aRnd.x * innerHeight / 2320 * fade.
       RADIUS_K is the per-grain birth RADIUS before aRnd.x and fade. */
    let radiusK = 2.5;
    const recomputeK = () => {
      radiusK = Math.max(1.1, (13 * window.innerHeight) / 4640);
    };

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      recomputeK();
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (x: number, y: number) => {
      const g = grains[head] ?? ({} as Grain);
      g.x = x + rand(-JITTER, JITTER);
      g.y = y + rand(-JITTER, JITTER);
      g.vx = rand(-VX, VX);
      g.vy = -rand(VY_MIN, VY_MAX); // source +y is up; canvas +y is down
      g.birth = now;
      g.size = radiusK * rand(0.5, 1.15); // 13 * aRnd.x, folded to a radius
      g.phase = rand(0, Math.PI * 2);
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
      ctx.globalCompositeOperation = "lighter"; // source: THREE.AdditiveBlending

      let alive = 0;
      for (const g of grains) {
        if (!g || g.birth < 0) continue;
        const age = now - g.birth;
        if (age < 0 || age > LIFE) continue;
        const u = age / LIFE;
        const drag = 1 - DRAG * u;
        const x = g.x + g.vx * age * drag + Math.sin(g.phase + age * 2.6) * WANDER * u;
        const y = g.y + g.vy * age * drag - LIFT * age;
        const vA = smoothstep(0, 0.09, u) * (1 - smoothstep(0.4, 1, u));
        const a = vA * PEAK;
        if (a <= 0.002) continue;
        const r = g.size * (0.45 + 0.55 * (1 - u));
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
      sprite = makeSprite();
      t0 = performance.now();
      resize();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("resize", resize);
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
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx = null;
    };

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
