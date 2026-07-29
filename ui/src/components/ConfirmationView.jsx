const NUTRI_VAR = { A: "--nutri-a", B: "--nutri-b", C: "--nutri-c", D: "--nutri-d", E: "--nutri-e" };

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 12.5l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 4l10 17H2L12 4z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ConfirmationView({ data, onStartOver }) {
  const {
    sessionId,
    cart = [],
    skipped = [],
    total,
    budget,
    freeDeliveryMinimum,
    metFreeDeliveryMinimum,
    reasoning = [],
    krogerCartUpdated,
    summary,
  } = data;

  return (
    <div className="confirmation-view">
      <div className={`confirmation-status${krogerCartUpdated ? " confirmation-status--success" : " confirmation-status--warning"}`}>
        <span className="confirmation-status__icon">
          {krogerCartUpdated ? <CheckIcon /> : <WarnIcon />}
        </span>
        <div>
          <h1>{krogerCartUpdated ? "Added to your Kroger cart" : "Saved, but the Kroger cart write failed"}</h1>
          <p>{summary}</p>
        </div>
      </div>

      {!krogerCartUpdated && (
        <p className="confirmation-note">
          Your picks were saved to Supabase for reference, but nothing was actually added to a Kroger
          cart — likely because the Kroger OAuth connection isn't active on the backend right now.
        </p>
      )}

      <div className="confirmation-grid">
        <section className="confirmation-cart">
          <h2>Cart</h2>
          <ul className="cart-list">
            {cart.map((item, i) => {
              const nutriLetter = (item.nutriScore || "").toUpperCase();
              const nutriVar = NUTRI_VAR[nutriLetter];
              return (
                <li className="cart-list__item" key={i}>
                  <div>
                    <span className="cart-list__category">{item.category}</span>
                    <span className="cart-list__desc">{item.description}</span>
                  </div>
                  <div className="cart-list__meta">
                    {nutriVar && (
                      <span className="score-badge" style={{ "--badge-color": `var(${nutriVar})` }}>
                        {nutriLetter}
                      </span>
                    )}
                    <span className="cart-list__price">${Number(item.price).toFixed(2)}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {skipped.length > 0 && (
            <div className="cart-skipped">
              <span className="cart-skipped__label">Skipped</span>
              <ul>
                {skipped.map((s, i) => (
                  <li key={i}>
                    <strong>{s.category}</strong> — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="confirmation-summary">
          <div className="summary-row">
            <span>Total</span>
            <span className="summary-row__value">${Number(total).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Budget</span>
            <span className="summary-row__value">${Number(budget).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Free delivery minimum</span>
            <span className={`summary-row__value${metFreeDeliveryMinimum ? "" : " summary-row__value--warn"}`}>
              ${Number(freeDeliveryMinimum).toFixed(2)} {metFreeDeliveryMinimum ? "· met" : "· not met"}
            </span>
          </div>

          {reasoning.length > 0 && (
            <div className="reasoning-trail">
              <span className="reasoning-trail__label">Reasoning trail</span>
              <ul>
                {reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {sessionId && <p className="confirmation-session">session {sessionId}</p>}
        </aside>
      </div>

      <button type="button" className="btn btn--primary" onClick={onStartOver}>
        Start a new order
      </button>
    </div>
  );
}
