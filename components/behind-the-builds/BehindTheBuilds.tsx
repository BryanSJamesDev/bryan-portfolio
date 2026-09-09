"use client";

/* "Behind the builds" — a rotating stack of LinkedIn posts.

   Adapted from ThreeUI's KoiStudies (SHA-256 32cf6493…): the layered-card
   structure, per-depth stack transforms, pointer tilt, and the drag / swipe /
   keyboard card-switching model are ported from its controller. Dropped: the
   canvas halftone rendering, the three embedded videos, the pixel-mask reveal,
   the WebGL shader background, the orbit rings and the per-word text ink-in —
   none of it serves post cards, and the copy has to stay readable and still.

   All styles and handlers are scoped to `.btb`. No global demo CSS is imported. */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type MouseEvent as RMouseEvent,
  type KeyboardEvent as RKeyboardEvent,
} from "react";
import { behindTheBuilds, formatPostDate, type BehindTheBuildPost } from "@/data/behind-the-builds";
import "./behind-the-builds.css";

const VISIBLE = 3; // front card + two peeking behind it

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* the card surface advances on click; anything the browser already handles —
   the LinkedIn anchor, the nav buttons — is excluded from both the advance
   handler and the drag-start so it keeps its native behaviour */
const isInteractive = (t: EventTarget | null) =>
  t instanceof Element && t.closest("a[href], button, input, select, textarea, [role='button']") !== null;

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  traveled: number;
  committed: -1 | 0 | 1;
};

export function BehindTheBuilds({ posts = behindTheBuilds }: { posts?: BehindTheBuildPost[] }) {
  const count = posts.length;
  // order: back → front. The last entry is the front card.
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: count }, (_, i) => count - 1 - i),
  );
  const [live, setLive] = useState("");
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const frontArticleRef = useRef<HTMLElement | null>(null);
  const frontInnerRef = useRef<HTMLDivElement | null>(null);
  const innerMap = useRef<Map<number, HTMLDivElement>>(new Map());
  const drag = useRef<DragState | null>(null);
  const suppressClickUntil = useRef(0);
  const busy = useRef(false);
  const interacted = useRef(false);
  const finePointer = useRef(true);

  const frontId = order[order.length - 1];
  const frontPost = posts[frontId];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fp = window.matchMedia("(hover: hover) and (pointer: fine)");
    const cp = window.matchMedia("(pointer: coarse)");
    const sync = () => { setReduced(mq.matches); setCoarse(cp.matches); finePointer.current = fp.matches; };
    sync();
    mq.addEventListener("change", sync);
    fp.addEventListener("change", sync);
    cp.addEventListener("change", sync);
    return () => { mq.removeEventListener("change", sync); fp.removeEventListener("change", sync); cp.removeEventListener("change", sync); };
  }, []);

  const setVars = (el: HTMLElement | null, x = 0, y = 0, tiltX = 0, tiltY = 0, turn = 0) => {
    if (!el) return;
    el.style.setProperty("--drag-x", `${x.toFixed(2)}px`);
    el.style.setProperty("--drag-y", `${y.toFixed(2)}px`);
    el.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    el.style.setProperty("--drag-turn", `${turn.toFixed(2)}deg`);
  };

  /* whenever the order changes, hand every card back to CSS, announce the new
     front card, and keep focus from being stranded on a now-inert card */
  useEffect(() => {
    innerMap.current.forEach((el) => {
      setVars(el);
      delete el.dataset.fling;
      delete el.dataset.enter;
      el.classList.remove("is-tracking");
    });
    if (!interacted.current) return;
    setLive(`${posts[frontId].title}. Post ${frontId + 1} of ${count}.`);
    const root = stageRef.current;
    const active = document.activeElement as HTMLElement | null;
    if (root && (active === document.body || (active && active.closest("[inert]")))) {
      frontArticleRef.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const next = useCallback(() => {
    setOrder((o) => { const f = o[o.length - 1]; return [f, ...o.filter((x) => x !== f)]; });
  }, []);
  const prev = useCallback(() => {
    setOrder((o) => { const b = o[0]; return [...o.slice(1), b]; });
  }, []);

  const commit = useCallback((dir: -1 | 1) => {
    if (busy.current) return;
    interacted.current = true;
    if (reduced) { if (dir < 0) next(); else prev(); return; }
    if (dir < 0) {
      busy.current = true;
      const el = frontInnerRef.current;
      if (el) el.dataset.fling = "left";
      window.setTimeout(() => { busy.current = false; next(); }, 190);
      return;
    }
    // "previous" — reorder now, then let the incoming card settle in from the left
    prev();
    window.requestAnimationFrame(() => {
      const inEl = frontInnerRef.current;
      if (inEl) {
        inEl.dataset.enter = "left";
        window.requestAnimationFrame(() => { if (inEl) delete inEl.dataset.enter; });
      }
    });
  }, [next, prev, reduced]);

  const commitRef = useRef(commit);
  commitRef.current = commit;

  // ── drag / swipe — window listeners live for the component's lifetime and gate
  //    on the drag ref, so a fast flick can't out-race a state update ───────────
  const onPointerDown = (e: RPointerEvent<HTMLElement>) => {
    if (busy.current || drag.current || (e.button !== 0 && e.button !== undefined)) return;
    if (isInteractive(e.target)) return; // the link / a button owns this press
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, traveled: 0, committed: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    stageRef.current?.setAttribute("data-dragging", "true");
  };

  /* click / tap anywhere on the front card's own surface → next post. Excludes
     the anchor and buttons (they handle themselves) and is skipped for ~350ms
     after a real drag so a swipe never doubles as an advance. */
  const onCardClick = (e: RMouseEvent) => {
    if (isInteractive(e.target) || performance.now() < suppressClickUntil.current) return;
    interacted.current = true;
    commit(-1);
  };

  useEffect(() => {
    const stageW = () => Math.max(1, stageRef.current?.getBoundingClientRect().width ?? 320);
    const endDrag = () => { drag.current = null; stageRef.current?.removeAttribute("data-dragging"); };

    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      d.traveled = Math.max(d.traveled, Math.hypot(dx, dy));
      const w = stageW();
      const threshold = clamp(w * 0.18, 52, 88);
      const dir = Math.abs(dx) >= threshold && Math.abs(dx) >= Math.abs(dy) * 0.75 ? (Math.sign(dx) as -1 | 1) : 0;
      if (dir) d.committed = dir;
      setVars(frontInnerRef.current, dx, dy, clamp(-dy / w * 5, -5, 5), clamp(dx / w * 6, -6, 6), clamp(dx / w * 10, -12, 12));
    };

    const up = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const w = stageW();
      const threshold = clamp(w * 0.18, 52, 88);
      const releaseDir = Math.abs(dx) >= threshold && Math.abs(dx) >= Math.abs(dy) * 0.75 ? (Math.sign(dx) as -1 | 1) : 0;
      const dir = releaseDir || d.committed;
      if (d.traveled > 3) suppressClickUntil.current = performance.now() + 350;
      endDrag();
      if (dir === 0) setVars(frontInnerRef.current);
      else commitRef.current(dir);
    };

    const cancel = () => { setVars(frontInnerRef.current); endDrag(); };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, []);

  // ── pointer tilt (hover, fine pointer, motion allowed) ──────────────────────
  const onStagePointerMove = (e: RPointerEvent) => {
    if (drag.current || reduced || !finePointer.current || e.pointerType === "touch") return;
    const el = frontInnerRef.current;
    const r = stackRef.current?.getBoundingClientRect();
    if (!el || !r) return;
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) { el.classList.remove("is-tracking"); setVars(el); return; }
    el.classList.add("is-tracking");
    setVars(el, 0, 0, clamp((0.5 - y) * 9, -4.75, 4.75), clamp((x - 0.5) * 9, -4.75, 4.75), 0);
  };
  const onStagePointerLeave = () => {
    const el = frontInnerRef.current;
    if (el && !drag.current) { el.classList.remove("is-tracking"); setVars(el); }
  };

  // ── keyboard (scoped to focus within the component) ─────────────────────────
  const onStageKeyDown = (e: RKeyboardEvent) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); interacted.current = true; commit(1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); interacted.current = true; commit(-1); }
  };

  const onLinkClick = (e: RMouseEvent) => {
    if (performance.now() < suppressClickUntil.current) e.preventDefault();
  };

  return (
    <section className="btb" aria-labelledby="btb-heading">
      <h3 id="btb-heading" className="btb-heading">Behind the builds</h3>
      <div
        ref={stageRef}
        className="btb-stage"
        onPointerMove={onStagePointerMove}
        onPointerLeave={onStagePointerLeave}
        onKeyDown={onStageKeyDown}
      >
        <div ref={stackRef} className="btb-stack" role="group" aria-roledescription="card stack" aria-label="LinkedIn posts — drag, swipe, or use the left and right arrow keys">
          {posts.map((post) => {
            const oi = order.indexOf(post.id);
            const depth = order.length - 1 - oi;
            const isFront = depth === 0;
            const hidden = depth >= VISIBLE;
            return (
              <article
                key={post.id}
                ref={(el) => { if (isFront) frontArticleRef.current = el; }}
                className="btb-card"
                data-depth={Math.min(depth, VISIBLE)}
                aria-hidden={isFront ? undefined : "true"}
                inert={!isFront || undefined}
                tabIndex={isFront ? 0 : -1}
                style={{ zIndex: count - depth, opacity: hidden ? 0 : undefined }}
                onPointerDown={isFront ? onPointerDown : undefined}
                onClick={isFront ? onCardClick : undefined}
              >
                <div
                  ref={(el) => {
                    if (el) innerMap.current.set(post.id, el); else innerMap.current.delete(post.id);
                    if (isFront) frontInnerRef.current = el;
                  }}
                  className="btb-card-inner"
                >
                  <div className="btb-media">
                    <img
                      src={post.imageSrc}
                      alt={post.imageAlt}
                      width={1100}
                      height={825}
                      loading={isFront ? "eager" : "lazy"}
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="btb-body">
                    <p className="btb-meta">
                      <span className="btb-badge">LinkedIn</span>
                      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                    </p>
                    <h4 className="btb-title">{post.title}</h4>
                    <p className="btb-excerpt">{post.excerpt}</p>
                    <a
                      className="btb-link"
                      href={post.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={isFront ? 0 : -1}
                      onClick={onLinkClick}
                    >
                      Read on LinkedIn <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="btb-controls">
          <button type="button" className="btb-nav" aria-label="Previous post" onClick={() => { interacted.current = true; commit(1); }}>
            <span aria-hidden="true">‹</span>
          </button>
          <p className="btb-counter" aria-hidden="true"><span>{frontId + 1}</span> / {count}</p>
          <button type="button" className="btb-nav" aria-label="Next post" onClick={() => { interacted.current = true; commit(-1); }}>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <p className="btb-hint" aria-hidden="true">
          {coarse ? "Tap card to browse · swipe" : "Click card to browse · drag · ← →"}
        </p>
        <p className="btb-status" aria-live="polite" aria-atomic="true">{live}</p>
        <span className="btb-sr-title" hidden>{frontPost.title}</span>
      </div>
    </section>
  );
}
