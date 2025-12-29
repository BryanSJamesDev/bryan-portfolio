import { profile } from "../data/profile";

export default function Publications() {
  return (
    <div className="card p-5">
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {profile.publications.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
