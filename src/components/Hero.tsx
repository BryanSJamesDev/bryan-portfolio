import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { profile } from "../data/profile";
import { Icons } from "./Icons";

function SocialIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (l.includes("github")) return <Icons.Github className="h-5 w-5" />;
  if (l.includes("linkedin")) return <Icons.Linkedin className="h-5 w-5" />;
  return <Icons.Newspaper className="h-5 w-5" />;
}

export default function Hero({ onOpenCmdk }: { onOpenCmdk: () => void }) {
  // Single quote (clean + human)
  // If you add `photoQuote` to profile.ts later, it will use that automatically.
  const photoQuote =
    (profile as unknown as { photoQuote?: string }).photoQuote ??
    "If you made it here, we should talk.";

  const [showBubble, setShowBubble] = useState(false);
  const timerRef = useRef<number | null>(null);

  function onPhotoClick() {
    setShowBubble(true);

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setShowBubble(false);
    }, 4000);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="noise" />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(800px 400px at 50% 20%, rgba(124,58,237,0.25), transparent 60%), radial-gradient(700px 380px at 60% 55%, rgba(34,197,94,0.18), transparent 60%)"
        }}
      />

      <div className="container-safe">
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center py-10 text-center sm:py-12">
          {/* Clickable Photo + Bubble */}
          <div className="relative mx-auto w-fit">
            <button
              type="button"
              onClick={onPhotoClick}
              className="group relative block rounded-full focus:outline-none focus:ring-2 focus:ring-black/10"
              aria-label="Show a message"
              title={showBubble ? "Hide" : "Click me"}
            >
              <motion.img
                src="/profile.jpg"
                alt={profile.name}
                className="h-56 w-56 rounded-full object-cover shadow-soft sm:h-72 sm:w-72"
                style={{ border: "1px solid rgb(var(--border))" }}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
              />
            </button>

            {/* Speech bubble */}
            <div
              className={`pointer-events-none absolute left-1/2 bottom-[calc(100%+14px)] w-[360px] -translate-x-1/2 transition-all duration-300
              ${showBubble ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            >
              <div
                className="
                  relative rounded-[22px] border-2 px-4 py-3 text-sm
                  bg-white/95 text-slate-900 border-slate-200
                  shadow-[0_12px_30px_rgba(0,0,0,0.12)]
                  backdrop-blur-sm
                "
              >
                <div className="font-semibold leading-relaxed">{photoQuote}</div>

                {/* Bubble tail */}
                <div
                  className="
                    absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45
                    border-b-2 border-r-2
                    bg-white/95 border-slate-200
                  "
                />
              </div>
            </div>
          </div>

          <motion.p
            className="muted mt-6 text-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            Hi there, I am
          </motion.p>

          <motion.h1
            className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            {profile.name}
          </motion.h1>

          <motion.p
            className="mt-5 text-lg font-medium sm:text-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
          >
            Software Engineering and Machine Learning
          </motion.p>

          <motion.p
            className="muted mt-4 max-w-2xl text-sm leading-relaxed sm:text-base"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
          >
            {profile.tagline}
          </motion.p>

          {/* Social icons */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {profile.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                aria-label={l.label}
                title={l.label}
              >
                <SocialIcon label={l.label} />
              </a>
            ))}
          </motion.div>

          {/* Buttons */}
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <a className="btn-primary" href="#projects">
              View Projects
            </a>

            <a
              className="btn-secondary"
              href={`mailto:${profile.emailPrimary}?subject=${encodeURIComponent("Portfolio - Hello!")}`}
            >
              Email Me
            </a>

            <a className="btn-secondary" href="/Bryan_Samuel_James_Resume.pdf" download>
              Download Resume
            </a>

            <button className="btn-secondary" type="button" onClick={onOpenCmdk} title="Search">
              Search
            </button>
          </motion.div>

          {/* Scroll hint */}
          <div className="muted mt-10 text-xs">Scroll down to explore</div>
        </div>
      </div>
    </section>
  );
}
