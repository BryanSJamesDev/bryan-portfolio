import { useEffect, useMemo, useState } from "react";
import { profile, type Link } from "../data/profile";
import { Icons } from "./Icons";

function score(text: string, q: string) {
  const t = text.toLowerCase();
  const s = q.toLowerCase().trim();
  if (!s) return 1;
  if (t === s) return 100;
  if (t.startsWith(s)) return 60;
  if (t.includes(s)) return 25;
  return 0;
}

export default function CommandPalette({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const all = profile.shortcuts;
    const ranked = all
      .map((x) => ({ x, s: score(x.label, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.x);
    return ranked.slice(0, 12);
  }, [q]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border bg-[rgb(var(--bg))] shadow-soft" style={{ borderColor: "rgb(var(--border))" }}>
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "rgb(var(--border))" }}>
          <Icons.Command className="h-4 w-4" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type to search… (e.g. projects, github, contact)"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button className="btn-secondary" type="button" onClick={onClose}>
            Esc
          </button>
        </div>

        <div className="max-h-[50vh] overflow-auto p-2">
          {items.length === 0 ? (
            <div className="muted p-3 text-sm">No matches.</div>
          ) : (
            <ul className="grid gap-2">
              {items.map((it: Link) => (
                <li key={it.href}>
                  <a
                    className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm hover:opacity-90"
                    style={{ borderColor: "rgb(var(--border))" }}
                    href={it.href}
                    onClick={onClose}
                    target={it.href.startsWith("http") ? "_blank" : undefined}
                    rel={it.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icons.ArrowUpRight className="h-4 w-4" />
                      {it.label}
                    </span>
                    <span className="muted text-xs">{it.href.startsWith("#") ? "jump" : "open"}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="muted border-t px-4 py-2 text-xs" style={{ borderColor: "rgb(var(--border))" }}>
          Tip: you can open this anytime with <strong>Ctrl</strong> + <strong>K</strong>.
        </div>
      </div>
    </div>
  );
}
