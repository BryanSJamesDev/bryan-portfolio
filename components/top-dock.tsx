"use client";
/* Portfolio integration of ThreeUI's AnimatedTopDock — Sable Dock variant
   (source revision 5a736cd3c1f6f19802f61ebb10e1701b9f7aa26e).

   The authored component (components/animated-top-dock/AnimatedTopDock.tsx) is
   vendored verbatim and renders a fixed demo item set with internal state. This
   site needs the dock wired to its own sections with real anchor navigation and
   the page's existing scroll-spy `active` state, so the dock is composed here
   directly from the two pieces that carry the authored behaviour:

     - createTopDockController — the exact spring/proximity engine, unmodified.
     - the `.animated-top-dock__*` DOM contract, reproduced structurally.

   The controller still owns everything a visitor feels: the proximity widening,
   focus/keyboard handling, reduced-motion → static, the coarse-pointer /
   narrow-viewport opt-out.

   The dock is always mounted and always fixed at the top — there is no
   scroll gate. Navigation must never depend on it: if the controller throws, or
   the subtree throws while rendering, this falls back to the plain `.sticky-nav`
   markup — plain text links, no animation. */
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createTopDockController } from "@/components/animated-top-dock/topDockController";

/* the Sable Dock knobs from the ThreeUI configured-usage brief */
const DOCK_OPTIONS = {
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
} as const;

export type TopDockItem = { id: string; label: string };
export type TopDockCta = { label: string; href: string; external?: boolean };

/* icons are the sable ITEMS glyphs from AnimatedTopDock.tsx, kept on the same
   0 0 16 16 grid; decorative only (aria-hidden, hidden under 600px) */
const ICONS: Record<string, ReactNode> = {
  work: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M2 6h12M5 4.5h.01M7 4.5h.01" />
    </>
  ),
  experience: (
    <>
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="12.5" cy="3.5" r="1.5" />
      <circle cx="12.5" cy="12.5" r="1.5" />
      <path d="M4.5 7.3 11 4.2M4.5 8.7l6.5 3.1" />
    </>
  ),
  about: (
    <>
      <path d="M4 2.25h5.4L12 4.85v8.9H4z" />
      <path d="M9.25 2.25V5h2.7M6 8h4M6 10.5h4" />
    </>
  ),
  contact: (
    <>
      <circle cx="5.2" cy="6.2" r="2.7" />
      <path d="m7.2 8.2 5.9 5.1M10.2 10.8l1.5-1.5M12 12.4l1.4-1.4" />
    </>
  ),
};

const EXT_ARROW = (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M3.2 8.8 8.8 3.2M4.4 3.2h4.4v4.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function CtaLink({ cta }: { cta: TopDockCta }) {
  return (
    <a
      className="animated-top-dock__cta"
      href={cta.href}
      aria-label={cta.label}
      {...(cta.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : null)}
    >
      <span>{cta.label}</span>
      {cta.external ? EXT_ARROW : null}
    </a>
  );
}

function PlainNav({
  items,
  activeId,
  cta,
}: {
  items: readonly TopDockItem[];
  activeId: string;
  cta?: TopDockCta;
}) {
  /* the plain-text fallback — always shown, since the dock has no scroll gate */
  return (
    <nav aria-label="Main navigation" className="sticky-nav shown">
      <a href="#hero" className="nav-brand">
        bj<span className="accent">.</span>
      </a>
      <div>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            {item.label}
          </a>
        ))}
        {cta ? (
          <a
            href={cta.href}
            {...(cta.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : null)}
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </nav>
  );
}

function DockNav({
  items,
  activeId,
  cta,
  onFail,
}: {
  items: readonly TopDockItem[];
  activeId: string;
  cta?: TopDockCta;
  onFail: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = navRef.current;
    if (!root) return undefined;
    /* the controller owns every WebGL-free bit of motion here; there is no GL
       context in the sable variant, but its setup still touches matchMedia,
       ResizeObserver and layout reads, so guard it and fall back on any throw */
    let dispose: (() => void) | undefined;
    try {
      dispose = createTopDockController(root, () => ({ ...DOCK_OPTIONS }));
    } catch (error) {
      console.error(
        "AnimatedTopDock controller failed to initialise; using plain nav.",
        error,
      );
      onFail();
      return undefined;
    }
    return () => {
      try {
        dispose?.();
      } catch {
        /* teardown must never throw into React */
      }
    };
  }, [onFail]);

  return (
    <div className="animated-top-dock-component">
      <nav
        ref={navRef}
        className="animated-top-dock__nav"
        aria-label="Main navigation"
        data-dock-state="idle"
        data-dock-max="0.00"
      >
        <a
          className="animated-top-dock__item animated-top-dock__logo"
          href="#hero"
          aria-label="Bryan James — back to top"
        >
          <span className="hex" aria-hidden="true" />
        </a>
        {items.map((item) => (
          <a
            key={item.id}
            className="animated-top-dock__item animated-top-dock__link"
            data-dock-item
            href={`#${item.id}`}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            <span className="animated-top-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16">{ICONS[item.id]}</svg>
            </span>
            <span>{item.label}</span>
          </a>
        ))}
        {cta ? <CtaLink cta={cta} /> : null}
      </nav>
    </div>
  );
}

class DockBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("AnimatedTopDock render error; using plain nav.", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function TopDock({
  items,
  activeId,
  cta,
}: {
  items: readonly TopDockItem[];
  activeId: string;
  cta?: TopDockCta;
}) {
  const [failed, setFailed] = useState(false);
  const fallback = <PlainNav items={items} activeId={activeId} cta={cta} />;

  return (
    <div className="top-dock-shell">
      {failed ? (
        fallback
      ) : (
        <DockBoundary fallback={fallback}>
          <DockNav
            items={items}
            activeId={activeId}
            cta={cta}
            onFail={() => setFailed(true)}
          />
        </DockBoundary>
      )}
    </div>
  );
}
