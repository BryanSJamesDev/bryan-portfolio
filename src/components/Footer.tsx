export default function Footer() {
  return (
    <footer className="border-t py-10" style={{ borderColor: "rgb(var(--border))" }}>
      <div className="container-safe flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-sm font-medium">© {new Date().getFullYear()} Bryan Samuel James</div>
      </div>
    </footer>
  );
}
