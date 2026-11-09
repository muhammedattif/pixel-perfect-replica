import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { slides } from "@/lib/slides";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({ slide: Number(s.slide) || 1 }),
  head: () => ({
    meta: [
      { title: "Supporting 3-decimal currencies" },
      { name: "description", content: "From a 2-decimal store to minor units, without downtime." },
      { property: "og:title", content: "Supporting 3-decimal currencies" },
      { property: "og:description", content: "From a 2-decimal store to minor units, without downtime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deck,
});

function rich(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((p, i) =>
    p.startsWith("`") ? <code key={i} className="deck-code">{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>,
  );
}

function Deck() {
  const { slide } = Route.useSearch();
  const navigate = Route.useNavigate();
  const total = slides.length;
  const index = Math.min(Math.max(slide, 1), total) - 1;
  const [dir, setDir] = useState(1);
  const touch = useRef<number | null>(null);

  const go = useCallback(
    (n: number) => {
      if (n < 0 || n >= total || n === index) return;
      setDir(n > index ? 1 : -1);
      navigate({ search: { slide: n + 1 }, replace: true });
    },
    [index, total, navigate],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(index + 1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(index - 1); }
      if (e.key === "Home") go(0);
      if (e.key === "End") go(total - 1);
      if (e.key === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, total]);

  useEffect(() => {
    document.title = `${index + 1}/${total} — ${slides[index].title}`;
  }, [index, total]);

  const s = slides[index];
  const isTitle = index === 0;
  let n = 0;

  return (
    <main
      className="deck"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <div className="deck-bg" aria-hidden />
      <div className="deck-grid" aria-hidden />

      <header className="deck-top">
        <span className="deck-brand">.001</span>
        <span className="deck-count">
          {String(index + 1).padStart(2, "0")} <span className="text-muted-foreground">/ {String(total).padStart(2, "0")}</span>
        </span>
      </header>

      <section key={index} className={`deck-stage ${dir > 0 ? "from-right" : "from-left"}`}>
        {isTitle ? (
          <div className="deck-hero">
            <div className="deck-digits" aria-hidden>
              <span>5</span><span>.</span><span>7</span><span>3</span><span className="deck-digit-new">1</span>
            </div>
            <h1 className="deck-title-lg">{s.title}</h1>
            <p className="deck-subtitle">{s.subtitle}</p>
          </div>
        ) : (
          <div className="deck-body">
            <p className="deck-kicker">
              <span className="deck-kicker-num">{String(index + 1).padStart(2, "0")}</span> {s.kicker}
            </p>
            <h2 className="deck-title">{s.title}</h2>
            <div className={`deck-blocks ${s.blocks.length > 1 ? "multi" : ""} ${s.blocks.length > 2 ? "tri" : ""}`}>
              {s.blocks.map((b, bi) => (
                <div key={bi} className={`deck-block ${b.heading?.includes("shipped") ? "is-shipped" : ""}`} style={{ animationDelay: `${150 + bi * 120}ms` }}>
                  {b.heading && <h3 className="deck-block-head">{rich(b.heading)}</h3>}
                  <ul className="deck-list">
                    {b.items.map((it, ii) => (
                      <li key={ii} className="deck-item" style={{ animationDelay: `${250 + n++ * 60}ms` }}>
                        {rich(it)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="deck-nav">
        <button className="deck-btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide">←</button>
        <div className="deck-dots">
          {slides.map((_, i) => (
            <button key={i} className={`deck-dot ${i === index ? "active" : ""}`} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
        <button className="deck-btn" onClick={() => go(index + 1)} disabled={index === total - 1} aria-label="Next slide">→</button>
      </footer>
      <div className="deck-progress" style={{ transform: `scaleX(${(index + 1) / total})` }} />
    </main>
  );
}
