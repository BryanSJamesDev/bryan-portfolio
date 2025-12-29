import { profile } from "../data/profile";

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((s) => (
          <span key={s} className="chip text-xs">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Skills() {
  const { languages, frameworks, tooling, domains } = profile.skills;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SkillGroup title="Languages" items={languages} />
      <SkillGroup title="Frameworks & Libraries" items={frameworks} />
      <SkillGroup title="Tools & Platforms" items={tooling} />
      <SkillGroup title="Domains" items={domains} />
    </div>
  );
}
