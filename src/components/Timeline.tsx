import { motion } from "framer-motion";
import { profile } from "../data/profile";

export default function Timeline() {
  return (
    <div className="grid gap-4">
      {profile.experience.map((e) => (
        <motion.article
          key={e.org + e.role}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35 }}
          className="card p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                {e.logo ? (
                  <div
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-white shadow-soft sm:h-24 sm:w-24"
                    style={{ borderColor: "rgb(var(--border))" }}
                  >
                    <img
                      src={e.logo}
                      alt={`${e.org} logo`}
                      className="h-full w-full object-contain p-3"
                      loading="lazy"
                    />
                  </div>
                ) : null}



                <div className="text-base font-semibold">
                  {e.role} · {e.org}
                </div>
              </div>

              <div className="muted mt-1 text-sm">
                {e.location} · {e.dates}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {e.tags.map((t) => (
                <span key={t} className="chip text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
            {e.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </motion.article>
      ))}
    </div>
  );
}
