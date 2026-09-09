"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Project } from "@/data/projects";
import "./book-showcase.css";
import { useProjectTimeline } from "./useProjectTimeline";

/* How each project works — written from its real description + stack in
   data/projects.ts, not invented. Projects with nothing substantive to say
   yet (OPS) get no step list. */
const STEPS: Record<string, { title: string; body: string }[]> = {
  agentfirst: [
    { title: "Runs inside ChatGPT over MCP", body: "The model calls the agent's tools directly through the Model Context Protocol — a real integration, not a scripted demo path." },
    { title: "Browses and reasons", body: "It reads what it finds on each page and decides the next step toward completing the task on its own." },
    { title: "Completes the transaction", body: "A TypeScript/Bun REST API carries the checkout through Stripe against a PostgreSQL store, with a React frontend for the human view." },
    { title: "Verified end to end", body: "Automated tests exercise every layer, from the API surface down through payment." },
  ],
  "patent-search": [
    { title: "SQL pre-filter first", body: "Structured fields narrow the 10,578-claim corpus before any embedding work — a filter-first design that a naive filter-after version got wrong, missing 40 of 41 true matches." },
    { title: "Semantic vector search", body: "Sentence-transformer embeddings held in FAISS rank the survivors by meaning rather than keywords." },
    { title: "Cross-encoder rerank", body: "A second pass re-scores the top candidates pairwise, trading a little latency for precision at the top of the list." },
    { title: "Served over FastAPI", body: "The whole pipeline sits behind a single retrieval endpoint." },
  ],
  "parity-agent": [
    { title: "Isolated country sessions", body: "The same product is fetched from separate, geographically distinct sessions using Bright Data, wrapped as a custom MCP server." },
    { title: "Normalize and diff", body: "Prices are normalized to a common basis and compared to surface personalized or regional spread." },
    { title: "Self-healing selectors", body: "When a scraper breaks, a model relocates the price element and the repair is validated before it is persisted." },
    { title: "Verified both ways", body: "A correct negative on Amazon, and a real ~99% regional price spread on Steam." },
  ],
  "contract-guard": [
    { title: "Two pipelines, one feed", body: "Every record runs a naive path and a contract-validated path in parallel, built in Python with Airflow and dbt." },
    { title: "Validate against the contract", body: "Records whose types or shape violate the expected schema are flagged at ingestion." },
    { title: "Quarantine the drift", body: "Offending records are held back before they can reach downstream reporting." },
    { title: "Measured, not asserted", body: "A controlled 200-trial experiment: 100% catch rate on breaking drift, 0% false positives, +15.5ms median overhead." },
  ],
  "robot-pipeline": [
    { title: "Perceive", body: "OpenCV reads the scene from the camera feed." },
    { title: "Plan the action", body: "Detections are turned into concrete targets for the arm." },
    { title: "Act", body: "Commands drive an SO-ARM101 arm through the lerobot / Feetech servo stack." },
    { title: "Built under a deadline", body: "Assembled at the Physical AI Sprint Hackathon (Nebius / NVIDIA / Antioch / Toloka)." },
  ],
};

const num2 = (n: number) => String(n).padStart(2, "0");

export function BookShowcase({ num = "01", projects, demos }: { num?: string; projects: Project[]; demos: ReactNode[] }) {
  const [mode, setMode] = useState<"gallery" | "detail">("gallery");
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [videoState, setVideoState] = useState<"idle" | "playing" | "missing">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);

  const timeline = useProjectTimeline(projects.length, mode === "detail");

  /* the bookmark state persists across visits (no list view yet, but the
     toggle means something) */
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("bsx-saved") || "{}")); } catch { /* private mode */ }
  }, []);

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bsxRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const pointer = useRef({ x: 0, y: 0, clientX: -10000, clientY: -10000 });
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const showToast = useCallback((msg: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  /* pointer-reactive tilt on the open card — detail view only */
  const runParallax = useCallback(() => {
    rafRef.current = 0;
    if (reduced.current || mode !== "detail" || selected === null) return;
    const card = cardRefs.current[selected];
    if (!card) return;
    if (flipped) { card.style.setProperty("--detail-yaw", "0deg"); card.style.setProperty("--detail-pitch", "0deg"); return; }
    const p = pointer.current;
    const b = card.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const inView = p.clientX >= 0 && p.clientX <= window.innerWidth && p.clientY >= 0 && p.clientY <= window.innerHeight;
    const reachX = p.clientX < cx ? Math.max(cx, 1) : Math.max(window.innerWidth - cx, 1);
    const reachY = p.clientY < cy ? Math.max(cy, 1) : Math.max(window.innerHeight - cy, 1);
    const vx = inView ? Math.max(-1, Math.min(1, (p.clientX - cx) / reachX)) : 0;
    const vy = inView ? Math.max(-1, Math.min(1, (p.clientY - cy) / reachY)) : 0;
    card.style.setProperty("--detail-yaw", `${vx * 10}deg`);
    card.style.setProperty("--detail-pitch", `${vy * -7}deg`);
  }, [mode, selected, flipped]);

  useEffect(() => {
    if (mode !== "detail") return;
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
        clientX: e.clientX,
        clientY: e.clientY,
      };
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(runParallax);
    };
    const onLeave = () => {
      pointer.current = { x: 0, y: 0, clientX: -10000, clientY: -10000 };
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(runParallax);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [runParallax, mode]);

  const openBook = useCallback((i: number) => {
    /* cancel any in-flight programmatic smooth scroll, then hand the timeline's
       inline card transforms back to CSS so the detail layout isn't fought */
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
    cardRefs.current.forEach((c) => {
      if (!c) return;
      c.style.removeProperty("transform");
      c.style.removeProperty("opacity");
      c.style.removeProperty("z-index");
      c.style.removeProperty("visibility");
      c.style.removeProperty("pointer-events");
    });
    setSelected(i);
    setMode("detail");
    const card = cardRefs.current[i];
    card?.style.setProperty("--detail-yaw", "0deg");
    card?.style.setProperty("--detail-pitch", "0deg");
    window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), reduced.current ? 0 : 560);
  }, []);

  const closeDetail = useCallback(() => {
    setMode((m) => (m === "detail" ? "gallery" : m));
  }, []);

  /* the flip + its video are per-open state — reset whenever the open card
     changes or the detail view closes */
  useEffect(() => {
    setFlipped(false);
    setVideoState("idle");
    const v = videoRef.current;
    if (v) { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } }
  }, [selected, mode]);

  /* turning the card back to its front always stops the demo */
  useEffect(() => {
    if (flipped) return;
    const v = videoRef.current;
    if (v) { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } }
    setVideoState("idle");
  }, [flipped]);

  const onCardClick = useCallback((i: number) => {
    if (mode === "gallery") { openBook(i); return; }
    if (selected !== i) return;
    if (!projects[i].demoVideo) { closeDetail(); return; }
    if (!flipped) { setFlipped(true); return; }
    const v = videoRef.current;
    if (!v || videoState === "missing") return;
    if (v.paused) v.play().then(() => setVideoState("playing")).catch(() => { /* autoplay blocked / no source */ });
    else { v.pause(); setVideoState("idle"); }
  }, [mode, selected, flipped, videoState, projects, openBook, closeDetail]);

  /* after the close transition, return focus to the clicked card (or, if the
     timeline has since scrolled it out of view, to the gallery) and drop the
     selection — never re-centre the gallery here */
  useEffect(() => {
    if (mode !== "gallery" || selected === null) return;
    const t = window.setTimeout(() => {
      const card = cardRefs.current[selected];
      const onScreen = card && card.getClientRects().length > 0 && getComputedStyle(card).visibility !== "hidden";
      if (onScreen) card.focus({ preventScroll: true });
      else bsxRef.current?.querySelector<HTMLElement>(".bsx-gallery")?.focus({ preventScroll: true });
      setSelected(null);
    }, reduced.current ? 0 : 560);
    return () => window.clearTimeout(t);
  }, [mode, selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDetail]);

  /* the detail view is a full-viewport modal — keep Tab inside it. The rest of
     the page is only visually covered, so without this the terminal, footer
     links and dock stay reachable behind the overlay. */
  useEffect(() => {
    if (mode !== "detail" || window.innerWidth <= 820) return;
    const root = bsxRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]'),
      ).filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = !!active && root.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) { e.preventDefault(); last.focus(); }
      } else if (!inside || active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [mode, selected, flipped, videoState]);

  /* lock page scroll while a book is open — the band takes over the viewport */
  useEffect(() => {
    if (mode !== "detail") return;
    if (window.innerWidth <= 820) return; // mobile: detail expands inline, page scrolls normally
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("bsx-locked");
    return () => { document.body.style.overflow = prev; document.body.classList.remove("bsx-locked"); };
  }, [mode]);

  const active = selected !== null ? projects[selected] : null;
  const activeSteps = active ? STEPS[active.slug] : undefined;
  const activeDemo = selected !== null ? demos[selected] : null;
  const activeTags = active ? active.tags.filter((t) => !t.startsWith("[")) : [];

  return (
    <section
      ref={timeline.sectionRef}
      id="work"
      className="project-timeline"
      data-simple={timeline.simple ? "true" : undefined}
      aria-label="Selected work"
    >
    <div ref={bsxRef} className="bsx" data-mode={mode} data-flipped={flipped ? "true" : undefined} data-playing={videoState === "playing" ? "true" : undefined}>
      <div className="bsx-topbar">
        <div className="bsx-heading">
          <p className="section-eyebrow">{num} — Projects</p>
          <h2 className="section-title bsx-title">Projects<span className="accent">.</span></h2>
        </div>
        <span className="bsx-count">{num2(projects.length)} Projects</span>
      </div>

      <div
        ref={timeline.trackRef}
        className="bsx-gallery"
        aria-label="Projects — use the left and right arrow keys to move between them"
        role="group"
        tabIndex={mode === "detail" ? -1 : 0}
        onKeyDown={(e) => {
          if (mode !== "gallery") return;
          if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
          const next = e.key === "ArrowRight" ? timeline.activeIndex + 1 : e.key === "ArrowLeft" ? timeline.activeIndex - 1 : null;
          if (next === null) return;
          e.preventDefault();
          const clamped = Math.max(0, Math.min(projects.length - 1, next));
          if (clamped === timeline.activeIndex) return;
          timeline.goTo(clamped, true);
          cardRefs.current[clamped]?.focus({ preventScroll: true });
        }}
      >
        {projects.map((p, i) => {
          const isOpen = mode === "detail" && selected === i;
          const hasVideo = Boolean(p.demoVideo);
          const label = mode === "gallery"
            ? `Open ${p.name} details${demos[i] ? " — includes an interactive demo" : ""}`
            : isOpen && hasVideo
              ? !flipped
                ? `Turn the ${p.name} card over to its video demo`
                : videoState === "playing"
                  ? `Pause the ${p.name} demo video`
                  : `Play the ${p.name} demo video`
              : `${p.name} details`;
          return (
          <button
            key={p.slug}
            ref={(el) => { cardRefs.current[i] = el; }}
            type="button"
            className={`bsx-book-card${selected === i ? " selected" : ""}`}
            data-slug={p.slug}
            data-active={i === timeline.activeIndex ? "true" : undefined}
            aria-label={label}
            tabIndex={mode === "detail" ? (isOpen && hasVideo ? 0 : -1) : (i === timeline.activeIndex ? 0 : -1)}
            onClick={() => onCardClick(i)}
            onPointerEnter={(e) => (e.currentTarget.dataset.hovered = "true")}
            onPointerLeave={(e) => (e.currentTarget.dataset.hovered = "false")}
          >
            <span className="bsx-book" aria-hidden="true">
              <span className="bsx-book-inner">
                <span className="bsx-front-cover">
                  {demos[i] ? <span className="bsx-card-try">Try it</span> : null}
                  <span className="bsx-cover-copy">
                    <span className="bsx-cover-kicker">Project {num2(i + 1)}</span>
                    <span className="bsx-cover-title">{p.name}</span>
                    <span className="bsx-cover-subtitle">{p.subtitle}</span>
                    <span className="bsx-cover-media">
                      {p.image ? (
                        <>
                          <img className="bsx-cover-shot" src={p.image} alt="" loading="lazy" />
                          {p.imageInset ? <img className="bsx-cover-shot bsx-cover-shot--inset" src={p.imageInset} alt="" loading="lazy" /> : null}
                        </>
                      ) : <span className="bsx-cover-rule" />}
                    </span>
                    <span className="bsx-cover-footer">{p.tags.filter((t) => !t.startsWith("[")).slice(0, 3).join(" · ") || "Repo"}</span>
                  </span>
                  {hasVideo ? <span className="bsx-card-flip-hint">▶ Watch demo</span> : null}
                </span>
                {hasVideo && isOpen ? (
                  <span className="bsx-back-cover" data-playing={videoState === "playing" ? "true" : undefined}>
                    <video
                      ref={videoRef}
                      className="bsx-demo-video"
                      src={p.demoVideo}
                      poster={p.demoPoster}
                      playsInline
                      preload="metadata"
                      onEnded={() => setVideoState("idle")}
                      onError={() => setVideoState("missing")}
                    />
                    {videoState === "missing"
                      ? <span className="bsx-demo-missing">Demo video coming soon</span>
                      : <span className="bsx-demo-play">▶</span>}
                  </span>
                ) : null}
              </span>
            </span>
          </button>
          );
        })}
      </div>

      <nav className="timeline-controls" aria-label="Browse projects" hidden={mode === "detail"}>
        <button type="button" aria-label="Previous project" disabled={timeline.activeIndex === 0} onClick={() => timeline.goTo(timeline.activeIndex - 1)}>‹</button>
        <div className="timeline-markers" role="tablist" aria-label="Projects">
          {projects.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              aria-label={`Show ${p.name}`}
              aria-current={timeline.activeIndex === i ? "true" : undefined}
              onClick={() => timeline.goTo(i)}
            ><span /></button>
          ))}
        </div>
        <span className="timeline-counter">{num2(timeline.activeIndex + 1)} / {num2(projects.length)}</span>
        <button type="button" aria-label="Next project" disabled={timeline.activeIndex === projects.length - 1} onClick={() => timeline.goTo(timeline.activeIndex + 1)}>›</button>
        <p className="timeline-hint">Scroll to move through · click a project to open</p>
      </nav>

      <div className="bsx-scrim" aria-hidden="true" onClick={closeDetail} />

      <section className="bsx-detail-panel" aria-live="polite" aria-hidden={mode !== "detail"} inert={mode !== "detail"}>
        <h3 className="bsx-detail-title">{active?.name}</h3>
        <div className="bsx-detail-scroll" tabIndex={0} aria-label={`${active?.name ?? "Project"} detail`}>
          <p className="bsx-detail-description">{active?.description}</p>

          {active?.demoVideo ? (
            <button type="button" className="bsx-demo-cta" onClick={() => setFlipped((f) => !f)}>
              {flipped ? "↩ Back to project details" : "▶ Watch the video demo"}
            </button>
          ) : null}

          {/* narrow screens have no flippable card — the demo plays inline instead */}
          {active?.demoVideo ? (
            <video
              className="bsx-demo-inline"
              src={active.demoVideo}
              poster={active.demoPoster}
              controls
              playsInline
              preload="none"
            />
          ) : null}

          {activeDemo ? (
            <section className="bsx-doc-section" aria-label="Try it">
              <p className="bsx-doc-label">Try it</p>
              <p className="bsx-doc-hint">Interactive — runs in your browser.</p>
              <div className="bsx-field-test">{activeDemo}</div>
            </section>
          ) : null}

          {activeSteps ? (
            <section className="bsx-doc-section" aria-label="How it works">
              <p className="bsx-doc-label">How it works</p>
              <ol className="bsx-doc-steps">
                {activeSteps.map((s) => (
                  <li key={s.title}>
                    <span className="bsx-doc-step-copy"><strong>{s.title}</strong><span>{s.body}</span></span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <div className="bsx-bottom-dock">
          <div className="bsx-meta-row" aria-label="Tech stack">
            {activeTags.map((t) => <span key={t} className="bsx-tag">{t}</span>)}
            <span className="bsx-meta-note">{active?.team ? "Team project" : "Solo build"}</span>
          </div>
          <hr className="bsx-detail-rule" />
          <div className="bsx-action-rail" aria-label="Project actions">
            <a className="bsx-pill primary" href={active?.repo} target="_blank" rel="noopener noreferrer">
              View Repo
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
            <button className="bsx-pill" type="button" onClick={() => {
              if (!active) return;
              const write = navigator.clipboard?.writeText?.(active.repo);
              if (write) write.then(() => showToast("Repo link copied.")).catch(() => showToast("Couldn't copy — the link is on the repo button."));
              else showToast("Copy isn't available here — use the repo button.");
            }}>Copy link</button>
            <button
              className="bsx-pill icon-only"
              type="button"
              aria-label={active && saved[active.slug] ? "Remove bookmark" : "Bookmark this project"}
              aria-pressed={active ? Boolean(saved[active.slug]) : false}
              onClick={() => {
                if (!active) return;
                const next = !saved[active.slug];
                setSaved((s) => {
                  const updated = { ...s, [active.slug]: next };
                  try { localStorage.setItem("bsx-saved", JSON.stringify(updated)); } catch { /* private mode */ }
                  return updated;
                });
                showToast(next ? "Bookmarked." : "Bookmark removed.");
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.8 4.2h10.4v15.6L12 16.6l-5.2 3.2V4.2Z" /></svg>
            </button>
          </div>
        </div>
      </section>

      <button ref={closeRef} className="bsx-close-button" type="button" aria-label="Close detail view" tabIndex={mode === "detail" ? 0 : -1} onClick={closeDetail}>×</button>

      {mode === "detail" && flipped ? (
        <button type="button" className="bsx-flip-back" onClick={() => setFlipped(false)}>↩ Back to card</button>
      ) : null}

      <div className="bsx-toast" role="status" aria-live="polite" data-show={toast ? "true" : "false"}>{toast}</div>
    </div>
    </section>
  );
}
