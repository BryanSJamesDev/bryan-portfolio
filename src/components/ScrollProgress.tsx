import { useEffect, useState } from "react";
import { clamp } from "../lib/utils";

export default function ScrollProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      const val = total <= 0 ? 0 : clamp(window.scrollY / total, 0, 1);
      setP(val);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 top-0 z-[60] h-[2px] w-full">
      <div
        className="h-full"
        style={{
          width: `${p * 100}%`,
          background:
            "linear-gradient(90deg, rgb(var(--ring)), rgba(124,58,237,0.15))"
        }}
      />
    </div>
  );
}
