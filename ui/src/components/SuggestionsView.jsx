import { useMemo, useState } from "react";
import OptionCard from "./OptionCard";

function defaultPicks(suggestions) {
  const picks = {};
  for (const cat of suggestions) {
    if (!cat.skippedReason && cat.options?.length > 0) {
      picks[cat.category] = cat.options[0].productId;
    }
  }
  return picks;
}

function defaultQuantities(suggestions) {
  const quantities = {};
  for (const cat of suggestions) {
    quantities[cat.category] = cat.quantity || 1;
  }
  return quantities;
}

export default function SuggestionsView({ data, onSubmit, onStartOver }) {
  const [picks, setPicks] = useState(() => defaultPicks(data.suggestions));
  const [quantities, setQuantities] = useState(() => defaultQuantities(data.suggestions));
  const [confirming, setConfirming] = useState(false);

  const pickableCategories = data.suggestions.filter((c) => !c.skippedReason);
  const allPicked = pickableCategories.every((c) => picks[c.category]);

  const runningTotal = useMemo(() => {
    let total = 0;
    for (const cat of pickableCategories) {
      const productId = picks[cat.category];
      if (!productId) continue;
      const opt = cat.options.find((o) => o.productId === productId);
      if (opt) total += Number(opt.price) * (quantities[cat.category] || 1);
    }
    return total;
  }, [picks, quantities, pickableCategories]);

  function selectOption(category, productId) {
    setPicks((prev) => ({ ...prev, [category]: productId }));
  }

  function setQuantity(category, qty) {
    const clamped = Math.max(1, Math.min(9, qty));
    setQuantities((prev) => ({ ...prev, [category]: clamped }));
  }

  function handleReviewClick() {
    setConfirming(true);
  }

  function handleConfirm() {
    const picksArray = pickableCategories.map((c) => ({
      category: c.category,
      productId: picks[c.category],
      quantity: quantities[c.category] || 1,
    }));
    onSubmit(picksArray);
  }

  const { usedPreferences } = data;

  return (
    <div className="suggestions-view">
      <div className="suggestions-view__header">
        <h1>Here's what Kroger has, ranked for you</h1>
        <p className="suggestions-view__subtitle">
          We've pre-picked the top option in each category — change any of them if you'd rather.
          Nothing is added to any cart until you confirm at the bottom.
        </p>
      </div>

      <div className="banner-row">
        <div className={`banner${data.overBudgetWarning ? " banner--warning" : ""}`}>
          <span className="banner__label">Budget</span>
          <span className="banner__value">${Number(data.budget).toFixed(2)}</span>
          <span className="banner__divider" />
          <span className="banner__label">Est. total (top pick everywhere)</span>
          <span className="banner__value">${Number(data.estimatedTotalIfTopPickEverywhere).toFixed(2)}</span>
          {data.overBudgetWarning && (
            <span className="banner__flag">Over budget even at the top picks — informational only, nothing is enforced</span>
          )}
        </div>

        <div className="banner banner--muted">
          {usedPreferences?.personalized ? (
            <span>
              Personalized from {usedPreferences.sessionsObserved} previous order
              {usedPreferences.sessionsObserved === 1 ? "" : "s"} · price sensitivity{" "}
              {usedPreferences.priceSensitivity} · quality weight {usedPreferences.qualityWeight}
            </span>
          ) : (
            <span>Not personalized yet — this is the first order on record for this user, so default weighting was used.</span>
          )}
        </div>
      </div>

      <div className="category-list">
        {data.suggestions.map((cat) => (
          <section className="category" key={cat.category}>
            <div className="category__header">
              <div>
                <h2>{cat.category}</h2>
                {cat.notes && <p className="category__notes">{cat.notes}</p>}
              </div>
              {!cat.skippedReason && (
                <div className="category__qty">
                  <span className="category__qty-label">Qty</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(cat.category, (quantities[cat.category] || 1) - 1)}
                    aria-label={`Decrease ${cat.category} quantity`}
                  >
                    −
                  </button>
                  <span>{quantities[cat.category] || 1}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(cat.category, (quantities[cat.category] || 1) + 1)}
                    aria-label={`Increase ${cat.category} quantity`}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {cat.skippedReason ? (
              <div className="category__skipped">
                Unavailable — {cat.skippedReason}
              </div>
            ) : (
              <>
                {cat.reasoning && (
                  <div className="category__reasoning">
                    <span className="category__reasoning-label">Why these options</span>
                    <p>{cat.reasoning}</p>
                  </div>
                )}
                <div className="option-grid">
                  {cat.options.map((opt, i) => (
                    <OptionCard
                      key={opt.productId}
                      option={opt}
                      name={`pick-${cat.category}`}
                      selected={picks[cat.category] === opt.productId}
                      onSelect={(productId) => selectOption(cat.category, productId)}
                      isTopPick={i === 0}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        ))}
      </div>

      <div className="submit-bar">
        <div className="submit-bar__total">
          <span className="submit-bar__total-label">Your picks so far</span>
          <span className="submit-bar__total-value">${runningTotal.toFixed(2)}</span>
          <span className="submit-bar__total-of"> of ${Number(data.budget).toFixed(2)} budget</span>
        </div>

        {!confirming ? (
          <div className="submit-bar__actions">
            <button type="button" className="btn btn--ghost" onClick={onStartOver}>
              Start over
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!allPicked}
              onClick={handleReviewClick}
            >
              Review &amp; add to cart
            </button>
          </div>
        ) : (
          <div className="confirm-panel">
            <p className="confirm-panel__warning">
              This is a real action. It will write these {pickableCategories.length} item
              {pickableCategories.length === 1 ? "" : "s"} to the actual Kroger cart connected to
              this backend, and save the session to Supabase. It is not reversible from this UI.
            </p>
            <div className="confirm-panel__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--danger" onClick={handleConfirm}>
                Yes — add to my real Kroger cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
