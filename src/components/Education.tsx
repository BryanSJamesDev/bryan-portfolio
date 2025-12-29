import { motion } from "framer-motion";
import { profile } from "../data/profile";

export default function Education() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {profile.education.map((e) => (
        <motion.article
          key={e.school}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-transparent p-5"
        >
          {/* Top row: Logo + Degree */}
          <div className="flex items-start gap-4">
            {e.logo && (
              <div
                className="
                  h-20 w-20 overflow-hidden rounded-2xl
                  bg-white p-2
                  shadow-[0_10px_30px_rgba(0,0,0,0.18)]
                "
              >
                <img
                  src={e.logo}
                  alt={`${e.school} logo`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-base font-semibold">{e.degree}</div>
              <div className="mt-1 text-sm">
                {e.school} · <span className="muted">{e.location}</span>
              </div>
              <div className="muted mt-1 text-xs">{e.dates}</div>
            </div>
          </div>

          <div className="mt-4 text-sm font-semibold">Relevant courses</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {e.courses.map((c) => (
              <span key={c} className="chip text-xs">
                {c}
              </span>
            ))}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
