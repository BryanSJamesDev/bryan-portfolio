"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Project } from "@/data/projects";
import "./book-showcase.css";

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

type CoverTone = { color: string; ink: string };
const TONES: CoverTone[] = [
  { color: "#363126", ink: "#31291e" },
  { color: "#5d5540", ink: "#33301f" },
  { color: "#566044", ink: "#293024" },
  { color: "#6f4b34", ink: "#4b281a" },
  { color: "#4a5340", ink: "#26302a" },
  { color: "#7c5a3a", ink: "#3a2a1a" },
];

const FAN = {
  x: ["14%", "27.5%", "41.5%", "58.5%", "72.5%", "86%"],
  y: ["44%", "38%", "33%", "33%", "38%", "44%"],
  w: [
    "min(15vw, 200px)", "min(16.5vw, 222px)", "min(17.5vw, 238px)",
    "min(17.5vw, 238px)", "min(16.5vw, 222px)", "min(15vw, 200px)",
  ],
  r: ["-13deg", "-8deg", "-2deg", "2deg", "8deg", "13deg"],
  yaw: ["-12deg", "-8deg", "-3deg", "3deg", "8deg", "12deg"],
  z: [1, 3, 5, 6, 4, 2],
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

const BLOSSOMS = [
  { x: "4%", s: "30px", r: "18deg", d: "10s", delay: "-4s" },
  { x: "16%", s: "19px", r: "74deg", d: "8.5s", delay: "-1s" },
  { x: "31%", s: "25px", r: "-20deg", d: "11s", delay: "-7s" },
  { x: "44%", s: "17px", r: "48deg", d: "9.5s", delay: "-5s" },
  { x: "58%", s: "28px", r: "12deg", d: "12s", delay: "-8s" },
  { x: "69%", s: "20px", r: "92deg", d: "9s", delay: "-3s" },
  { x: "79%", s: "32px", r: "32deg", d: "11.5s", delay: "-6s" },
  { x: "89%", s: "22px", r: "-14deg", d: "10.5s", delay: "-9s" },
  { x: "96%", s: "16px", r: "56deg", d: "8s", delay: "-2s" },
];

export function BookShowcase({ projects, demos }: { projects: Project[]; demos: ReactNode[] }) {
  const [mode, setMode] = useState<"gallery" | "detail">("gallery");
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const rootRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
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

  const runParallax = useCallback(() => {
    rafRef.current = 0;
    const root = rootRef.current;
    if (!root || reduced.current) return;
    const p = pointer.current;

    if (mode === "detail" && selected !== null) {
      const card = cardRefs.current[selected];
      if (!card) return;
      const b = card.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      const inView = p.clientX >= 0 && p.clientX <= window.innerWidth && p.clientY >= 0 && p.clientY <= window.innerHeight;
      const reachX = p.clientX < cx ? Math.max(cx, 1) : Math.max(window.innerWidth - cx, 1);
      const reachY = p.clientY < cy ? Math.max(cy, 1) : Math.max(window.innerHeight - cy, 1);
      const vx = inView ? Math.max(-1, Math.min(1, (p.clientX - cx) / reachX)) : -5 / 16;
      const vy = inView ? Math.max(-1, Math.min(1, (p.clientY - cy) / reachY)) : 0;
      card.style.setProperty("--detail-yaw", `${vx * 16}deg`);
      card.style.setProperty("--detail-pitch", `${vy * -10}deg`);
      return;
    }

    if (mode !== "gallery") return;
    root.style.setProperty("--mx", `${p.x * 11}px`);
    root.style.setProperty("--my", `${p.y * 8}px`);
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const depth = 0.5 + (1 - Math.abs(i - 2.5) / 2.5) * 0.5;
      card.style.setProperty("--local-x", `${p.x * 15 * depth}px`);
      card.style.setProperty("--local-y", `${p.y * 9 * depth}px`);
    });
  }, [mode, selected]);

  useEffect(() => {
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
  }, [runParallax]);

  const openBook = useCallback((i: number) => {
    setSelected(i);
    setMode("detail");
    const card = cardRefs.current[i];
    card?.style.setProperty("--detail-yaw", "-5deg");
    card?.style.setProperty("--detail-pitch", "0deg");
    window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), reduced.current ? 0 : 700);
  }, []);

  const closeDetail = useCallback(() => {
    setMode((m) => {
      if (m !== "detail") return m;
      const last = selected;
      window.setTimeout(() => {
        cardRefs.current[last ?? 0]?.focus({ preventScroll: true });
        setSelected(null);
      }, reduced.current ? 0 : 700);
      return "gallery";
    });
  }, [selected]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDetail(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDetail]);

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
    <section ref={rootRef} id="work" className="bsx" data-mode={mode} aria-label="Selected work">
      <div className="bsx-topbar">
        <p className="bsx-kicker"><span>01 / the evidence</span>Selected work</p>
        <span className="bsx-count">06 Projects</span>
      </div>

      <h2 className="bsx-hero-word" aria-hidden="true">Projects</h2>

      <div className="bsx-gallery" aria-label="Project field manuals">
        {projects.map((p, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <button
              key={p.slug}
              ref={(el) => { cardRefs.current[i] = el; }}
              type="button"
              className={`bsx-book-card${selected === i ? " selected" : ""}`}
              aria-label={`Open ${p.name} details`}
              tabIndex={mode === "detail" ? -1 : 0}
              onClick={() => mode === "gallery" && openBook(i)}
              onPointerEnter={(e) => (e.currentTarget.dataset.hovered = "true")}
              onPointerLeave={(e) => (e.currentTarget.dataset.hovered = "false")}
              style={{
                // @ts-expect-error custom properties
                "--x": FAN.x[i], "--y": FAN.y[i], "--w": FAN.w[i],
                "--r": FAN.r[i], "--yaw": FAN.yaw[i], zIndex: FAN.z[i],
                "--cover-color": tone.color, "--cover-ink": tone.ink,
              }}
            >
              <span className="bsx-book" aria-hidden="true">
                <span className="bsx-book-shadow" />
                <span className="bsx-book-back" />
                <span className="bsx-page-block" />
                <span className="bsx-page-fan"><i /><i /><i /><i /></span>
                <span className="bsx-front-cover">
                  <span className="bsx-corner tl" /><span className="bsx-corner tr" />
                  <span className="bsx-corner bl" /><span className="bsx-corner br" />
                  <span className="bsx-cover-copy">
                    <span className="bsx-cover-kicker">Project · {ROMAN[i]}</span>
                    <span className="bsx-cover-title">{p.name}</span>
                    <span className="bsx-cover-subtitle">{p.subtitle}</span>
                    <span className="bsx-cover-plate">Plate<br />Pending</span>
                    <span className="bsx-cover-footer">{p.tags.filter((t) => !t.startsWith("[")).slice(0, 3).join(" · ") || "Field Manual"}</span>
                  </span>
                </span>
                <span className="bsx-open-badge">Read</span>
              </span>
            </button>
          );
        })}
      </div>

      <section className="bsx-detail-panel" aria-live="polite" aria-hidden={mode !== "detail"} inert={mode !== "detail"}>
        <h3 className="bsx-detail-title">{active?.name}</h3>
        <div className="bsx-detail-scroll" tabIndex={0} aria-label={`${active?.name ?? "Project"} detail`}>
          <p className="bsx-detail-description">{active?.description}</p>

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

          {activeDemo ? (
            <section className="bsx-doc-section" aria-label="Field test">
              <p className="bsx-doc-label">Field test</p>
              <div className="bsx-field-test">{activeDemo}</div>
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
              if (active) { navigator.clipboard?.writeText(active.repo).catch(() => {}); showToast("Repo link copied."); }
            }}>Copy link</button>
            <button
              className="bsx-pill icon-only"
              type="button"
              aria-label={active && saved[active.slug] ? "Remove from reading list" : "Save to reading list"}
              aria-pressed={active ? Boolean(saved[active.slug]) : false}
              onClick={() => {
                if (!active) return;
                const next = !saved[active.slug];
                setSaved((s) => ({ ...s, [active.slug]: next }));
                showToast(next ? "Saved to your reading list." : "Removed from your reading list.");
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.8 4.2h10.4v15.6L12 16.6l-5.2 3.2V4.2Z" /></svg>
            </button>
          </div>
        </div>
      </section>

      <button ref={closeRef} className="bsx-close-button" type="button" aria-label="Close detail view" tabIndex={mode === "detail" ? 0 : -1} onClick={closeDetail}>×</button>

      <div className="bsx-blossom-field" aria-hidden="true">
        {BLOSSOMS.map((bl, i) => (
          <span key={i} className="bsx-blossom" style={{
            // @ts-expect-error custom properties
            "--blossom-x": bl.x, "--blossom-size": bl.s, "--blossom-r": bl.r,
            "--blossom-duration": bl.d, "--blossom-delay": bl.delay,
          }}><i /><i /><i /><i /><i /></span>
        ))}
      </div>

      <div className="bsx-toast" role="status" aria-live="polite" data-show={toast ? "true" : "false"}>{toast}</div>
    </section>
  );
}
