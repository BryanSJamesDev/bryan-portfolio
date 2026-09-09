"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* Native vertical scrolling on desktop maps continuously to a fractional project
 * index; the paint pass writes each card's transform inline off its distance from
 * that index. Mobile and reduced-motion drop the pinning and perspective entirely
 * and track the nearest card in a normal horizontal snap gallery instead.
 *
 * No wheel/touch listeners, no scroll hijacking, no animation library. Scroll and
 * resize are passive and coalesced to one rAF per burst. While `paused` (a project
 * detail view is open) the pass stops and the cards are handed back to CSS. */
export function useProjectTimeline(count: number, paused: boolean) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [simple, setSimple] = useState(true);
  const frame = useRef(0);
  const step = useRef(520);
  const last = Math.max(0, count - 1);

  useEffect(() => {
    const media = matchMedia("(max-width: 820px), (prefers-reduced-motion: reduce)");
    const update = () => setSimple(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>(".bsx-book-card"));

    const handBack = (card: HTMLElement) => {
      card.style.removeProperty("transform");
      card.style.removeProperty("opacity");
      card.style.removeProperty("z-index");
      card.style.removeProperty("visibility");
      card.style.removeProperty("pointer-events");
    };

    if (paused) {
      cards.forEach(handBack);
      return;
    }

    function paint() {
      frame.current = 0;
      if (!section || !track) return;
      step.current = Math.max(360, Math.min(620, window.innerHeight * 0.62));
      section.style.setProperty("--timeline-distance", `${last * step.current}px`);

      if (simple) {
        const center = track.scrollLeft + track.clientWidth / 2;
        let closest = 0;
        let best = Infinity;
        cards.forEach((card, i) => {
          const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (d < best) { best = d; closest = i; }
          handBack(card);
        });
        setActiveIndex(closest);
        return;
      }

      const p = Math.max(0, Math.min(last, -section.getBoundingClientRect().top / step.current));
      const spacing = Math.min(430, window.innerWidth * 0.3);
      cards.forEach((card, i) => {
        const delta = i - p;
        const dist = Math.abs(delta);
        const yaw = -Math.max(-1, Math.min(1, delta)) * 17;
        card.style.transform =
          `translate(-50%, -50%) translate3d(${delta * spacing}px, ${Math.min(dist, 3) * 26}px, ${-Math.min(dist, 4) * 175}px)` +
          ` rotateY(${yaw}deg) scale(${1 - Math.min(dist, 3) * 0.07})`;
        card.style.opacity = String(Math.max(0.14, 1 - dist * 0.32));
        card.style.zIndex = String(20 - Math.round(dist * 3));
        card.style.visibility = dist > 3 ? "hidden" : "visible";
        card.style.pointerEvents = dist > 2 ? "none" : "auto";
      });
      setActiveIndex(Math.round(p));
    }

    const schedule = () => { if (!frame.current) frame.current = requestAnimationFrame(paint); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    track.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    observer.observe(track);
    paint();
    return () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      track.removeEventListener("scroll", schedule);
    };
  }, [count, last, paused, simple]);

  const goTo = useCallback((index: number, immediate = false) => {
    if (paused) return;
    const i = Math.max(0, Math.min(last, index));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = immediate || reduce ? "instant" : "smooth";
    if (simple) {
      const track = trackRef.current;
      const card = track?.querySelectorAll<HTMLElement>(".bsx-book-card")[i];
      if (track && card) track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior });
    } else if (sectionRef.current) {
      window.scrollTo({ top: window.scrollY + sectionRef.current.getBoundingClientRect().top + i * step.current, behavior });
    }
  }, [last, paused, simple]);

  return { sectionRef, trackRef, activeIndex, simple, goTo };
}
