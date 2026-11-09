import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, Bug, Check, Database, Flag, Lock, Server, Timer, X, Zap } from "lucide-react";

export type VisualKey = "problem" | "constraints" | "shipped" | "flag" | "flow" | "faced";

export function SlideVisual({ kind }: { kind: VisualKey }) {
  switch (kind) {
    case "problem":
      return <ProblemVisual />;
    case "constraints":
      return <ConstraintsVisual />;
    case "shipped":
      return <ShippedVisual />;
    case "flag":
      return <FlagVisual />;
    case "flow":
      return <FlowVisual />;
    case "faced":
      return <FacedVisual />;
  }
}

/* ---------- 02 The problem: the third digit falls off ---------- */
function ProblemVisual() {
  return (
    <div className="vz vz-problem">
      <span className="sticker sticker-tilt-r" style={{ top: -14, right: 18 }}>ISO 4217</span>
      <p className="vz-label">Sent</p>
      <div className="vz-amount">
        5.73<span className="vz-drop">1</span>
        <small>KWD</small>
      </div>
      <div className="vz-arrow"><ArrowDown size={22} /> stored &amp; returned</div>
      <div className="vz-amount vz-amount-dim">
        5.73<span className="vz-ghost">_</span>
        <small>KWD</small>
      </div>
      <div className="vz-chips">
        {["KWD", "BHD", "OMR"].map((c, i) => (
          <span key={c} className="vz-chip" style={{ animationDelay: `${600 + i * 120}ms` }}>
            {c} <b>3 dp</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- 03 Constraints: sticker wall ---------- */
function ConstraintsVisual() {
  const items = [
    { icon: <Database size={26} />, label: "No table rewrite", tilt: -6 },
    { icon: <Timer size={26} />, label: "No downtime", tilt: 5 },
    { icon: <Server size={26} />, label: "APIs & webhooks unchanged", tilt: -3 },
    { icon: <Lock size={26} />, label: "Major units in & out", tilt: 7 },
  ];
  return (
    <div className="vz vz-stickers">
      {items.map((it, i) => (
        <div key={it.label} className="badge-sticker" style={{ ["--tilt" as string]: `${it.tilt}deg`, animationDelay: `${300 + i * 140}ms` }}>
          <span className="badge-sticker-icon">{it.icon}</span>
          <span>{it.label}</span>
        </div>
      ))}
      <div className="vz-flagpill">
        <Flag size={16} /> <code>money_high_precision_input</code> <span className="mini-switch" />
      </div>
    </div>
  );
}

/* ---------- 05 What we shipped: schema + conversion chart ---------- */
function ShippedVisual() {
  const rows = [
    { cur: "USD", major: "10.50", minor: "1050", exp: 2 },
    { cur: "KWD", major: "5.731", minor: "5731", exp: 3 },
    { cur: "JPY", major: "100", minor: "100", exp: 0 },
  ];
  return (
    <div className="vz vz-shipped">
      <div className="vz-schema">
        <div className="vz-schema-head"><Database size={15} /> table</div>
        <div className="vz-col"><code>amount</code><span className="tag">2 dp · kept</span></div>
        <div className="vz-col is-new"><code>amount_minor</code><span className="tag tag-new">integer · new</span></div>
        <div className="vz-col is-new"><code>amount_minor_currency</code><span className="tag tag-new">new</span></div>
      </div>
      <div className="vz-conv">
        {rows.map((r, i) => (
          <div key={r.cur} className="vz-conv-row" style={{ animationDelay: `${400 + i * 160}ms` }}>
            <span className="vz-cur">{r.cur}</span>
            <span className="vz-major">{r.major}</span>
            <span className="vz-exp">×10<sup>{r.exp}</sup></span>
            <ArrowRight size={16} className="vz-conv-arrow" />
            <span className="vz-digits">
              {r.minor.split("").map((d, j) => (
                <i key={j} className={j >= r.minor.length - r.exp ? "frac" : ""} style={{ animationDelay: `${700 + i * 160 + j * 70}ms` }}>{d}</i>
              ))}
            </span>
          </div>
        ))}
        <p className="vz-foot">highlighted = digits after the decimal point</p>
      </div>
    </div>
  );
}

/* ---------- 06 The one flag: interactive switch ---------- */
function FlagVisual() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`vz vz-flag ${on ? "is-on" : ""}`}>
      <span className="sticker sticker-tilt-l" style={{ top: -14, left: 18 }}>try it</span>
      <button className="big-switch" onClick={() => setOn((v) => !v)} aria-pressed={on} aria-label="Toggle the flag">
        <span className="big-switch-knob" />
      </button>
      <p className="vz-flag-state">{on ? "Flag on" : "Flag off"}</p>
      <div className="vz-flag-io" key={String(on)}>
        <span className="vz-flag-in">{on ? "5.731" : "5.739"}</span>
        <ArrowRight size={18} />
        <span className="vz-flag-out">{on ? "5.731" : "5.74"}</span>
        <small>KWD</small>
      </div>
      <p className="vz-flag-read">
        reads <code>{on ? "amount_minor" : "old column"}</code>
      </p>
    </div>
  );
}

/* ---------- 07 How a value moves: animated pipeline ---------- */
function FlowVisual() {
  const steps = [
    { t: "Merchant", d: "major amount" },
    { t: "Flag", d: "round or keep" },
    { t: "MoneyValue", d: "Decimal · half-up" },
    { t: "Save", d: "2 dp + minor columns" },
    { t: "Read", d: "off: old · on: minor" },
  ];
  return (
    <div className="vz vz-flow">
      <div className="vz-flow-line"><span className="vz-flow-pulse" /></div>
      {steps.map((s, i) => (
        <div key={s.t} className="vz-flow-step" style={{ animationDelay: `${300 + i * 150}ms` }}>
          <span className="vz-flow-dot">{i + 1}</span>
          <div>
            <b>{s.t}</b>
            <small>{s.d}</small>
          </div>
        </div>
      ))}
      <span className="sticker sticker-tilt-r" style={{ bottom: -12, right: 14 }}>never float</span>
    </div>
  );
}

/* ---------- 08 What we faced: float vs Decimal ---------- */
function FacedVisual() {
  return (
    <div className="vz vz-faced">
      <span className="sticker sticker-bug" style={{ top: -16, right: 16 }}><Bug size={14} /> gotchas</span>
      <div className="duel is-bad">
        <code>int(5.731 * 1000)</code>
        <span className="duel-out"><X size={16} /> 5730</span>
        <small>float</small>
      </div>
      <div className="duel is-good">
        <code>Decimal("5.731")</code>
        <span className="duel-out"><Check size={16} /> 5731</span>
        <small>Decimal</small>
      </div>
      <div className="duel is-bad">
        <code>KWD 123456 ÷ 10²</code>
        <span className="duel-out"><X size={16} /> 1234.56</span>
        <small>wrong exponent</small>
      </div>
      <div className="duel is-good">
        <code>KWD 123456 ÷ 10³</code>
        <span className="duel-out"><Check size={16} /> 123.456</span>
        <small>real exponent</small>
      </div>
    </div>
  );
}

/* ---------- Title slide floating stickers ---------- */
export function TitleStickers() {
  const s = [
    { t: "KWD", x: "8%", y: "18%", r: -12, d: 0 },
    { t: "BHD", x: "84%", y: "22%", r: 10, d: 0.6 },
    { t: "OMR", x: "12%", y: "74%", r: 8, d: 1.2 },
    { t: ".001", x: "82%", y: "72%", r: -8, d: 1.8 },
  ];
  return (
    <div className="title-stickers" aria-hidden>
      {s.map((k) => (
        <span key={k.t} className="float-sticker" style={{ left: k.x, top: k.y, ["--tilt" as string]: `${k.r}deg`, animationDelay: `${k.d}s` }}>
          {k.t === ".001" ? <Zap size={14} /> : null}
          {k.t}
        </span>
      ))}
    </div>
  );
}

export function stampFor(heading?: string): { label: string; tone: "good" | "muted" | "warn" | "info" } | null {
  if (!heading) return null;
  const h = heading.toLowerCase();
  if (h.includes("shipped")) return { label: "Shipped", tone: "good" };
  if (h.includes("set aside")) return { label: "Set aside", tone: "muted" };
  if (h.startsWith("still")) return { label: "Still open", tone: "warn" };
  if (h.startsWith("from here")) return { label: "From here", tone: "info" };
  return null;
}
