import { useEffect, useMemo, useState } from "react";
import { profile } from "../data/profile";
import ThemeToggle from "./ThemeToggle";
import Kbd from "./Kbd";
import { Icons } from "./Icons";

type NavItem = { label: string; href: string };

export default function Navbar({
  onOpenCmdk
}: {
  onOpenCmdk: () => void;
}) {
  const items = useMemo<NavItem[]>(
    () => [
      { label: "Projects", href: "#projects" },
      { label: "Experience", href: "#experience" },
      { label: "Skills", href: "#skills" },
      { label: "Education", href: "#education" },
      { label: "Contact", href: "#contact" }
    ],
    []
  );

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur"
      style={{
        background: scrolled ? "rgba(var(--bg), 0.75)" : "rgba(var(--bg), 0.35)",
        borderBottom: scrolled ? `1px solid rgb(var(--border))` : "1px solid transparent"
      }}
    >
      <div className="container-safe flex h-16 items-center justify-between gap-3">
        <a href="#" className="group flex items-center gap-2">
          <div
            className="grid h-9 w-9 place-items-center rounded-2xl text-sm font-semibold shadow-soft"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(34,197,94,0.85))",
              color: "white"
            }}
          >
            BJ
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight">{profile.name}</div>
            <div className="muted text-xs leading-tight">{profile.location}</div>
          </div>
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          {items.map((it) => (
            <a key={it.href} href={it.href} className="muted text-sm hover:opacity-80">
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            type="button"
            onClick={onOpenCmdk}
            title="Search"
          >
            <Icons.Command className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
}
