import { profile } from "../data/profile";
import { Icons } from "./Icons";

export default function Contact() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-5">
        <div className="text-sm font-semibold">Let’s talk</div>
        <p className="muted mt-2 text-sm">
          Recruiter, teammate, or fellow builder — send a note. I respond fastest via email.
        </p>

        <div className="mt-5 grid gap-2">
          <a className="btn-secondary justify-between" href={`mailto:${profile.emailPrimary}`}>
            <span className="inline-flex items-center gap-2">
              <Icons.Mail className="h-4 w-4" />
              {profile.emailPrimary}
            </span>
            <Icons.ArrowUpRight className="h-4 w-4" />
          </a>

          <a className="btn-secondary justify-between" href={`mailto:${profile.emailSchool}`}>
            <span className="inline-flex items-center gap-2">
              <Icons.Mail className="h-4 w-4" />
              {profile.emailSchool}
            </span>
            <Icons.ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold">Social</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                {l.label} <Icons.ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
