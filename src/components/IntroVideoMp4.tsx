import { useEffect, useRef, useState } from "react";

export default function IntroVideoMp4() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ Your local file from /public
  const mp4Url = "/pro-intro.mp4";

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Stop playback when closing
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    // reset play button state when modal closes
    if (!open) setPlaying(false);
  }, [open]);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        // autoplay restrictions or other errors
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="container-safe py-10" id="intro-video">
      <div className="grid items-center gap-6 md:grid-cols-2">
        {/* Left text */}
        <div className="text-left">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">A Quick Introduction</h2>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={() => setOpen(true)}>
              Watch the intro
            </button>
            <a className="btn-secondary" href="#projects">
              Skip to projects
            </a>
          </div>
        </div>

        {/* Right: small preview card (click to open modal) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group w-full text-left"
          aria-label="Open intro video"
          title="Open video"
        >
          <div className="relative overflow-hidden rounded-2xl border bg-white/60 shadow-soft dark:bg-white/5">
            <div className="relative w-full pb-[56.25%]">
              <video
                className="absolute left-0 top-0 h-full w-full object-cover"
                src={mp4Url}
                muted
                playsInline
                preload="metadata"
              />
            </div>

            {/* Play overlay (bottom-left only, no seconds) */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute bottom-4 left-4">
                <div className="pointer-events-none inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-sm font-medium text-white backdrop-blur transition group-hover:bg-black/70">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  Play
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Intro video modal"
        >
          <div className="mx-auto mt-10 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3">
              <div className="text-sm font-semibold text-white">Professional introduction</div>
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/15"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="relative overflow-hidden rounded-2xl border bg-black shadow-soft">
              <div className="relative w-full pb-[56.25%]">
                <video
                  ref={videoRef}
                  className="absolute left-0 top-0 h-full w-full"
                  src={mp4Url}
                  controls={false} // ✅ removes native overlay + “51s”
                  autoPlay
                  playsInline
                  preload="metadata"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                />

                {/* Custom play button in modal (bottom-left), shows only when paused */}
                {!playing && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="
                      absolute bottom-4 left-4
                      inline-flex items-center gap-2
                      rounded-full border border-white/15
                      bg-black/55 px-4 py-2
                      text-sm font-medium text-white
                      backdrop-blur
                      hover:bg-black/70
                      focus:outline-none focus:ring-2 focus:ring-white/20
                    "
                    aria-label="Play introduction video"
                    title="Play"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    Play
                  </button>
                )}

                {/* Optional: subtle hint to pause by clicking the video */}
                {/* Click-to-toggle is already enabled via the overlay button.
                    If you want click-video-to-toggle too, uncomment below and add onClick={togglePlay} on the <video>. */}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
