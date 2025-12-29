import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { profile, type Project } from "../data/profile";
import { cn } from "../lib/utils";

const kinds: Array<Project["kind"] | "All"> = ["All", "Software", "ML", "Data"];

function ProjectCard({ p }: { p: Project }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight">{p.title}</h3>
          <p className="muted mt-1 text-sm">{p.headline}</p>
        </div>
        <span className="chip">{p.kind}</span>
      </div>
      <div className="muted mt-3 text-xs">{p.dates}</div>

      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
        {p.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {p.stack.map((s) => (
          <span key={s} className="chip text-xs">
            {s}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

export default function ProjectGrid() {
  const [kind, setKind] = useState<(typeof kinds)[number]>("All");

  const filtered = useMemo(() => {
    if (kind === "All") return profile.projects;
    return profile.projects.filter((p) => p.kind === kind);
  }, [kind]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn("btn-secondary", k === kind && "btn-primary")}
          >
            {k}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2">
        {filtered.map((p) => (
          <ProjectCard key={p.title} p={p} />
        ))}
      </motion.div>

      <div className="mt-6 card p-5">
        <div className="text-sm font-semibold">More projects</div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {profile.moreProjects.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
