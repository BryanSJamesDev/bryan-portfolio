"use client";
/* Project card → centred detail view, hand-rolled FLIP.
 *
 * ── Transition timing/easing is ported verbatim from ThreeUI's
 *    CompleteShelfLandingPage (public/landing-pages/complete-shelf-v2.html,
 *    SHA-256 606f200fed86). That page opens a book with a Three.js camera dolly
 *    + mesh slerp AND a DOM panel that fades/slides — concurrently, off one
 *    click. The 3D half is the shelf metaphor (a cover swinging toward camera);
 *    our cards float and have no cover, so nothing 3D acts on them. What carries
 *    over is the *motion*: a rectangle scales/moves from where it was clicked
 *    into place while an editorial panel fades in and settles up — 100% a 2D
 *    scale/translate/opacity sequence, which is what the FLIP already is.
 *
 *    Exact source values, reproduced here:
 *      • DETAIL_TRANSITION_DURATION = 0.92s  → OPEN_MS 920  (open AND close)
 *      • progress remapped through Perlin smootherstep 6t⁵−15t⁴+10t³
 *        (source line 2047) → sampled into a WAAPI linear() easing, exact;
 *        cubic-bezier(.45,0,.55,1) fallback where linear() is unsupported
 *      • .detail-panel: opacity 620ms (delay 0) + transform translateY(28px→0)
 *        620ms (delay 300ms), timing-function cubic-bezier(0.2,0.72,0.24,1)
 *        → CONTENT_MS / CONTENT_STAGGER / SETTLE_Y / PANEL_EASE below
 *
 * WAAPI, not CSS transitions — the site's global prefers-reduced-motion rule
 * force-disables every CSS transition/animation. Under reduced motion the
 * transforms are skipped and only a short opacity crossfade plays, for the
 * open/close AND the next/prev swap.
 *
 * next/prev: the panel stays mounted and put; only .pe-inner content swaps,
 * with a horizontal take on the same 620ms / cubic-bezier(0.2,0.72,0.24,1)
 * fade+slide (direction flips with next vs prev). Wraps at both ends. Reachable
 * by the viewport-edge arrows, the ← → keys, and a touch swipe; presses landing
 * mid-swap are queued rather than dropped.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { RevealText } from "@/components/reveal-text";
import { LiquidMetal } from "@/components/liquid-metal/LiquidMetal";
import type { Project } from "@/data/projects";

/* ── ported transition constants ─────────────────────────────────────────── */
const OPEN_MS = 920; // DETAIL_TRANSITION_DURATION 0.92s
const CONTENT_MS = 620; // .detail-panel opacity / transform
const CONTENT_STAGGER = 300; // .detail-panel transition-delay on transform
const SETTLE_Y = 28; // .detail-panel translateY(28px)
const PANEL_EASE = "cubic-bezier(.2,.72,.24,1)"; // source --ease-out
const NAV_X = 34; // horizontal offset for the content swap
const REDUCED_MS = 150;

/** smootherstep (6t⁵−15t⁴+10t³) sampled into a WAAPI linear() easing — an exact
 *  reproduction of the source's remap. cubic-bezier fallback for old engines. */
const SMOOTHERSTEP = (() => {
  const ok =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("transition-timing-function", "linear(0, 1)");
  if (!ok) return "cubic-bezier(.45,0,.55,1)";
  const n = 24;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push((t * t * t * (t * (t * 6 - 15) + 10)).toFixed(5));
  }
  return `linear(${pts.join(",")})`;
})();

const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const repoLabel = (url: string) => {
  try {
    const parts = new URL(url).pathname.replace(/^\/|\/$/g, "").split("/");
    return parts[parts.length - 1] || url;
  } catch {
    return url;
  }
};

function ThumbInner({ project }: { project: Project }) {
  return project.image ? (
    <img src={project.image} alt="" className="pe-thumb__img" />
  ) : (
    <span className="pe-thumb__label mono">screenshot pending</span>
  );
}

function ProjectDetail({
  projects,
  demos,
  cardRefs,
  initialIndex,
  onClose,
}: {
  projects: Project[];
  demos: ReactNode[];
  cardRefs: RefObject<(HTMLElement | null)[]>;
  initialIndex: number;
  onClose: () => void;
}) {
  const total = projects.length;
  const [viewIndex, setViewIndex] = useState(initialIndex);
  const viewRef = useRef(viewIndex);
  viewRef.current = viewIndex;

  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const closing = useRef(false);
  const busy = useRef(false); // a nav swap is mid-flight
  const queued = useRef(0); // presses received during a swap, applied when it ends
  const titleId = useId();

  const project = projects[viewIndex];
  const demo = demos[viewIndex];

  /* every WAAPI animation runs through play() so it's tracked and can be
     cancelled — StrictMode double-mounts the open effect in dev, and a fast
     close/next mid-flight must not leave a stale transform on the panel that
     corrupts the next FLIP measurement. */
  const anims = useRef<Animation[]>([]);
  const play = (
    el: HTMLElement,
    keyframes: Keyframe[],
    opts: KeyframeAnimationOptions,
    onDone?: () => void,
  ) => {
    const a = el.animate(keyframes, opts);
    anims.current.push(a);
    const pull = () => {
      anims.current = anims.current.filter((x) => x !== a);
    };
    a.finished.then(() => {
      pull();
      onDone?.();
    }, pull);
    return a;
  };
  const stopAnims = () => {
    for (const a of anims.current) {
      try {
        a.cancel();
      } catch {
        /* already done */
      }
    }
    anims.current = [];
  };
  const clearO = (el: HTMLElement) => () => {
    el.style.opacity = "";
    el.style.willChange = "";
  };
  const clearT = (el: HTMLElement) => () => {
    el.style.transform = "";
  };

  const flipFrom = (cardEl: HTMLElement | null | undefined, panel: HTMLElement) => {
    if (!cardEl) return null;
    const c = cardEl.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    return `translate(${c.left - p.left}px, ${c.top - p.top}px) scale(${
      c.width / p.width
    }, ${c.height / p.height})`;
  };

  const runClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    queued.current = 0;
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!scrim || !panel || !inner) return onClose();
    stopAnims();
    scrim.style.pointerEvents = "none";

    const from = reduced() ? null : flipFrom(cardRefs.current?.[viewRef.current], panel);
    if (!from) {
      play(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, fill: "forwards" });
      play(inner, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, fill: "forwards" });
      play(panel, [{ opacity: 1 }, { opacity: 0 }], { duration: REDUCED_MS, fill: "forwards" }, onClose);
      return;
    }
    panel.style.willChange = "transform";
    // mirror of the open: FLIP back over 920ms smootherstep, content fades /
    // slides down over 620ms (no stagger, like .detail-panel's base rule)
    play(scrim, [{ opacity: 1 }, { opacity: 0 }], {
      duration: OPEN_MS,
      easing: SMOOTHERSTEP,
      fill: "forwards",
    });
    play(
      inner,
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: `translateY(${SETTLE_Y}px)` },
      ],
      { duration: CONTENT_MS, easing: PANEL_EASE, fill: "forwards" },
    );
    play(
      panel,
      [{ transform: "none" }, { transform: from }],
      { duration: OPEN_MS, easing: SMOOTHERSTEP, fill: "forwards" },
      onClose,
    );
  }, [cardRefs, onClose]);

  const navRef = useRef<(d: number) => void>(() => {});
  const navigate = useCallback(
    (delta: number) => {
      if (closing.current || total < 2) return;
      // a press during a swap is remembered, not dropped (the transition is long)
      if (busy.current) {
        queued.current += delta > 0 ? 1 : -1;
        return;
      }
      const inner = innerRef.current;
      const scrim = scrimRef.current;
      if (!inner) return;
      busy.current = true;
      stopAnims();
      const dir = delta > 0 ? 1 : -1;
      const done = () => {
        inner.style.opacity = "";
        inner.style.transform = "";
        busy.current = false;
        if (queued.current !== 0) {
          const d = queued.current > 0 ? 1 : -1;
          queued.current -= d;
          navRef.current(d);
        }
      };
      const swap = () => {
        setViewIndex((prev) => (prev + delta + total) % total);
        scrim?.scrollTo({ top: 0 });
      };

      if (reduced()) {
        play(inner, [{ opacity: 1 }, { opacity: 0 }], { duration: 90, fill: "forwards" }, () => {
          swap();
          requestAnimationFrame(() =>
            play(inner, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, fill: "forwards" }, done),
          );
        });
        return;
      }

      // out, then swap, then in — a horizontal take on the .detail-panel
      // fade+slide (620ms, cubic-bezier(.2,.72,.24,1)), direction flips
      play(
        inner,
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${dir * -NAV_X}px)` },
        ],
        { duration: 240, easing: PANEL_EASE, fill: "forwards" },
        () => {
          swap();
          requestAnimationFrame(() => {
            inner.style.transform = `translateX(${dir * NAV_X}px)`;
            play(inner, [{ opacity: 0 }, { opacity: 1 }], {
              duration: CONTENT_MS,
              easing: PANEL_EASE,
              fill: "forwards",
            });
            play(
              inner,
              [{ transform: `translateX(${dir * NAV_X}px)` }, { transform: "translateX(0)" }],
              { duration: CONTENT_MS, delay: 90, easing: PANEL_EASE, fill: "both" },
              done,
            );
          });
        },
      );
    },
    [total],
  );
  navRef.current = navigate;

  /* announce every content change for screen readers */
  useEffect(() => {
    if (liveRef.current)
      liveRef.current.textContent = `${project.name}. Project ${viewIndex + 1} of ${total}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewIndex]);

  /* open animation + scroll lock + focus + key/swipe handlers */
  useEffect(() => {
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!scrim || !panel || !inner) return;
    stopAnims();

    const sbw = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;

    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const from = reduced() ? null : flipFrom(cardRefs.current?.[initialIndex], panel);
    if (!from) {
      play(scrim, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, fill: "forwards" }, clearO(scrim));
      play(panel, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, fill: "forwards" }, clearO(panel));
      play(inner, [{ opacity: 0 }, { opacity: 1 }], { duration: REDUCED_MS, fill: "forwards" }, clearO(inner));
    } else {
      panel.style.opacity = "1";
      panel.style.willChange = "transform";
      inner.style.transform = `translateY(${SETTLE_Y}px)`;
      // scrim fade = the browse-chrome fade-out analog; 920ms smootherstep like the pose
      play(scrim, [{ opacity: 0 }, { opacity: 1 }], {
        duration: OPEN_MS,
        easing: SMOOTHERSTEP,
        fill: "forwards",
      }, clearO(scrim));
      // the FLIP: card rect → centred, 920ms, smootherstep (source's remap, exact)
      play(panel, [{ transform: from }, { transform: "none" }], {
        duration: OPEN_MS,
        easing: SMOOTHERSTEP,
        fill: "backwards",
      }, clearO(panel));
      // .detail-panel: opacity 620ms (delay 0) + translateY(28→0) 620ms (delay 300)
      play(inner, [{ opacity: 0 }, { opacity: 1 }], {
        duration: CONTENT_MS,
        easing: PANEL_EASE,
        fill: "backwards",
      }, clearO(inner));
      play(
        inner,
        [{ transform: `translateY(${SETTLE_Y}px)` }, { transform: "translateY(0)" }],
        { duration: CONTENT_MS, delay: CONTENT_STAGGER, easing: PANEL_EASE, fill: "both" },
        clearT(inner),
      );
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        runClose();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const t = document.activeElement?.tagName ?? "";
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t)) return;
        e.preventDefault();
        navigate(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = scrim.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const act = document.activeElement;
      if (!scrim.contains(act)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && act === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && act === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);

    let sx = 0;
    let sy = 0;
    let tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select,button,a,[role=switch]")) {
        tracking = false;
        return;
      }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        navigate(dx < 0 ? 1 : -1);
      }
    };
    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("keydown", onKey, true);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchend", onTouchEnd);
      stopAnims();
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
      prevFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={scrimRef}
      className="pe-scrim"
      style={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) runClose();
      }}
    >
      <div
        ref={panelRef}
        className="pe-panel"
        style={{ opacity: 0, transformOrigin: "0 0" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div ref={innerRef} className="pe-inner" style={{ opacity: 0 }}>
          {/* left ≈57%: the project image */}
          <div className="pe-media" aria-hidden="true">
            <ThumbInner project={project} />
          </div>

          {/* right ≈43%: the text column */}
          <div className="pe-column">
            <button
              ref={closeRef}
              type="button"
              className="pe-close"
              onClick={runClose}
              aria-label={`Close ${project.name} details`}
            >
              <X size={17} aria-hidden="true" />
            </button>

            <p className="pe-eyebrow mono">
              Volume {ROMAN[viewIndex] ?? viewIndex + 1} · {project.subtitle}
            </p>
            <h3 id={titleId} className="pe-title">
              {project.name}
            </h3>
            <p className="pe-deck">{project.description}</p>

            <dl className="pe-meta">
              <div>
                <dt>Stack</dt>
                <dd>{project.tags.join(" · ")}</dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{project.team ? "Team project" : "Solo project"}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={project.repo} target="_blank" rel="noopener noreferrer">
                    {repoLabel(project.repo)}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Volume</dt>
                <dd>
                  {viewIndex + 1} of {total}
                </dd>
              </div>
            </dl>

            {demo ?? null}

            <div className="pe-foot">
              <button
                type="button"
                className="pe-nav-btn"
                onClick={() => navigate(-1)}
                aria-label="Previous project"
                disabled={total < 2}
              >
                <ArrowLeft size={15} aria-hidden="true" />
              </button>
              <span className="pe-foot-status" aria-hidden="true">
                Project {viewIndex + 1} of {total}
              </span>
              <button
                type="button"
                className="pe-nav-btn"
                onClick={() => navigate(1)}
                aria-label="Next project"
                disabled={total < 2}
              >
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <p ref={liveRef} className="sr-only" aria-live="polite" />
      </div>
    </div>,
    document.body,
  );
}

export function ProjectCard({
  project,
  index,
  cardRef,
  onOpen,
}: {
  project: Project;
  index: number;
  cardRef: (el: HTMLElement | null) => void;
  onOpen: () => void;
}) {
  return (
    <article ref={cardRef} className="project reveal" id={project.slug}>
      <button
        type="button"
        className="pe-thumb pe-thumb-btn"
        aria-haspopup="dialog"
        aria-label={`Open ${project.name} details`}
        onClick={onOpen}
      >
        <ThumbInner project={project} />
      </button>
      <div className="project-top">
        <span className="project-number">{`0${index + 1}`}</span>
        {project.team ? <span className="tag">team project</span> : null}
        <LiquidMetal
          as="a"
          href={project.repo}
          external
          label="Repo"
          ariaLabel={`${project.name} — repository`}
          className="lm-slot--sm"
        />
      </div>
      <h3>
        <button
          type="button"
          className="pe-title-btn"
          aria-haspopup="dialog"
          onClick={onOpen}
        >
          <RevealText text={project.name} />
        </button>
      </h3>
      <p className="project-subtitle">{project.subtitle}</p>
      <p className="project-copy project-copy--clamp">
        <RevealText text={project.description} />
      </p>
      <ul className="tags" aria-label="Technologies">
        {project.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </article>
  );
}

export function ProjectGrid({
  projects,
  demos,
}: {
  projects: Project[];
  demos: ReactNode[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  return (
    <>
      <div className="projects">
        {projects.map((p, i) => (
          <ProjectCard
            key={p.slug}
            project={p}
            index={i}
            cardRef={(el) => {
              cardRefs.current[i] = el;
            }}
            onOpen={() => setOpenIndex(i)}
          />
        ))}
      </div>
      {openIndex !== null ? (
        <ProjectDetail
          projects={projects}
          demos={demos}
          cardRefs={cardRefs}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  );
}
