import { useEffect, useState } from "react";
import { Icons } from "./Icons";

const KEY = "bryan_theme";
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const root = document.documentElement;
  const attr = root.dataset.theme;
  if (attr === "light" || attr === "dark") return attr;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
  }, [theme]);

  return (
    <button
      className="btn-secondary"
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title="Toggle theme"
      type="button"
    >
      <Icons.SunMoon className="h-4 w-4" />
      <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
