import { motion } from "framer-motion";

export default function Section({
  id,
  title,
  icon,
  children,
  subtitle
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="container-safe py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            {icon ? <div className="rounded-xl border p-2" style={{ borderColor: "rgb(var(--border))" }}>{icon}</div> : null}
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          </div>
          {subtitle ? <p className="muted mt-2 max-w-2xl">{subtitle}</p> : null}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
