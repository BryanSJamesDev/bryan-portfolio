"use client";
/* Project card → centered detail view, with a hand-rolled FLIP morph.
 *
 * The interaction is adapted from skiper-ui's skiper80 "Projects Showcase" — a
 * Pro (paid) component we can't vendor, so this is the equivalent rebuilt from
 * its documented behaviour: a card's image + title animate into a large centred
 * panel holding the full write-up and the card's own interactive demo, then
 * animate back on close.
 *
 * No framer-motion. The morph is a FLIP — measure the card's rect, then play
 * the panel from that rect to its natural centred position — driven by the Web
 * Animations API rather than CSS transitions, because the site's global
 * `prefers-reduced-motion` rule force-disables every CSS transition/animation.
 * Under reduced motion the transform is skipped entirely and only a short
 * opacity crossfade plays.
 *
 * Coexistence with what the cards already do:
 *  - the collapsed card is preview + trigger only. Image and title open the
 *    panel; the "Repo" pill is a scoped link that does not.
 *  - the three cards that carried an embedded demo (patent search, contract-
 *    guard, pricing) get that demo rendered inside the panel — moved, not
 *    duplicated.
 *  - the three that were a whole-card link to GitHub lose that link; the repo
 *    is reachable from the pill and the panel's "View repo" button.
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
import { X } from "lucide-react";
import { RevealText } from "@/components/reveal-text";
import { LiquidMetal } from "@/components/liquid-metal/LiquidMetal";
import type { Project } from "@/data/projects";

const EASE = "cubic-bezier(.22,.61,.36,1)"; // the site's --ease
const EASE_OUT = "cubic-bezier(.4,0,.6,1)";
const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function ThumbInner({ project }: { project: Project }) {
  return project.image ? (
    <img src={project.image} alt="" className="pe-thumb__img" />
  ) : (
    <span className="pe-thumb__label mono">screenshot pending</span>
  );
}

function Detail({
  project,
  index,
  demo,
  cardRef,
  onDismiss,
}: {
  project: Project;
  index: number;
  demo?: ReactNode;
  cardRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const titleId = useId();

  const flip = (panel: HTMLElement) => {
    const card = cardRef.current;
    if (!card) return null;
    const c = card.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    return {
      from: `translate(${c.left - p.left}px, ${c.top - p.top}px) scale(${
        c.width / p.width
      }, ${c.height / p.height})`,
    };
  };

  const runClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!scrim || !panel || !inner) return onDismiss();
    scrim.style.pointerEvents = "none";

    let anim: Animation;
    const f = reduced() ? null : flip(panel);
    if (!f) {
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, fill: "forwards" });
      anim = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 130, fill: "forwards" });
    } else {
      panel.style.willChange = "transform";
      scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
      inner.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, fill: "forwards" });
      anim = panel.animate(
        [
          { transform: "none", opacity: 1 },
          { transform: f.from, opacity: 0.4 },
        ],
        { duration: 300, easing: EASE_OUT, fill: "forwards" },
      );
    }
    anim.finished.then(onDismiss, onDismiss);
  }, [cardRef, onDismiss]);

  useEffect(() => {
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    const inner = innerRef.current;
    if (!scrim || !panel || !inner) return;

    // lock body scroll, compensating for the scrollbar so the page doesn't jump
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPad = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;

    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const clear = (el: HTMLElement) => () => {
      el.style.opacity = "";
      el.style.willChange = "";
    };
    const swallow = () => {};

    const f = reduced() ? null : flip(panel);
    if (!f) {
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: "forwards" })
        .finished.then(clear(scrim), swallow);
      panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: "forwards" })
        .finished.then(clear(panel), swallow);
      inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: "forwards" })
        .finished.then(clear(inner), swallow);
    } else {
      panel.style.opacity = "1";
      panel.style.willChange = "transform";
      scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "forwards" })
        .finished.then(clear(scrim), swallow);
      panel.animate(
        [{ transform: f.from }, { transform: "none" }],
        { duration: 360, easing: EASE, fill: "backwards" },
      ).finished.then(clear(panel), swallow);
      inner.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 240,
        delay: 110,
        easing: "ease",
        fill: "both",
      }).finished.then(clear(inner), swallow);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        runClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const act = document.activeElement;
      if (!panel.contains(act)) {
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

    return () => {
      document.removeEventListener("keydown", onKey, true);
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
        <button
          ref={closeRef}
          type="button"
          className="pe-close"
          onClick={runClose}
          aria-label={`Close ${project.name} details`}
        >
          <X size={17} aria-hidden="true" />
        </button>
        <div ref={innerRef} className="pe-inner" style={{ opacity: 0 }}>
          <div className="pe-thumb pe-thumb--lg" aria-hidden="true">
            <ThumbInner project={project} />
          </div>
          <div className="pe-body">
            <p className="pe-eyebrow mono">
              {`0${index + 1}`}
              {project.team ? " · team project" : ""}
            </p>
            <h3 id={titleId}>{project.name}</h3>
            <p className="pe-subtitle">{project.subtitle}</p>
            <p className="pe-desc">{project.description}</p>
            <ul className="tags" aria-label="Technologies">
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="pe-actions">
              <LiquidMetal
                as="a"
                href={project.repo}
                external
                label="View repo"
                ariaLabel={`${project.name} — repository`}
                className="lm-slot--sm"
              />
            </div>
            {demo ?? null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ProjectCard({
  project,
  index,
  demo,
}: {
  project: Project;
  index: number;
  demo?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  return (
    <article ref={cardRef} className="project reveal" id={project.slug}>
      <button
        type="button"
        className="pe-thumb pe-thumb-btn"
        aria-haspopup="dialog"
        aria-label={`Open ${project.name} details`}
        onClick={() => setOpen(true)}
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
          onClick={() => setOpen(true)}
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
      {open ? (
        <Detail
          project={project}
          index={index}
          demo={demo}
          cardRef={cardRef}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </article>
  );
}
