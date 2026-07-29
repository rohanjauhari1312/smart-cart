import { useEffect, useState } from "react";

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

// stages: [{ label, at }] — `at` is the elapsed second this stage typically starts.
// The last stage has no upper bound and just stays active until the call resolves.
function currentStageIndex(stages, elapsed) {
  let idx = 0;
  for (let i = 0; i < stages.length; i++) {
    if (elapsed >= stages[i].at) idx = i;
  }
  return idx;
}

export default function LoadingState({ title, estimateText, stages }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const activeIndex = currentStageIndex(stages, elapsed);

  return (
    <div className="loading-state">
      <div className="loading-state__spinner" aria-hidden="true" />
      <h2>{title}</h2>

      <ul className="loading-state__steps">
        {stages.map((stage, i) => {
          const status = i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
          return (
            <li key={stage.label} className={`loading-state__step loading-state__step--${status}`}>
              <span className="loading-state__step-marker" aria-hidden="true">
                {status === "done" ? "✓" : status === "active" ? "" : ""}
              </span>
              <span className="loading-state__step-label">{stage.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="loading-state__meta">
        <span className="loading-state__elapsed">{formatElapsed(elapsed)} elapsed</span>
        <span className="loading-state__dot">·</span>
        <span>{estimateText}</span>
      </div>
      <p className="loading-state__note">
        This is a real, synchronous call to the live pipeline — not a demo shortcut.
        Leave this open, it'll resolve on its own.
      </p>
    </div>
  );
}
