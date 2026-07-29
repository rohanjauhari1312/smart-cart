const NUTRI_VAR = { A: "--nutri-a", B: "--nutri-b", C: "--nutri-c", D: "--nutri-d", E: "--nutri-e" };

const NOVA_LABEL = {
  1: "unprocessed",
  2: "culinary ingredient",
  3: "processed",
  4: "ultra-processed",
};

export default function OptionCard({ option, name, selected, onSelect, isTopPick }) {
  const nutriLetter = (option.nutriScore || "").toUpperCase();
  const nutriVar = NUTRI_VAR[nutriLetter];

  return (
    <label className={`option-card${selected ? " option-card--selected" : ""}`}>
      <input
        type="radio"
        name={name}
        checked={selected}
        onChange={() => onSelect(option.productId)}
        className="option-card__radio"
      />
      <div className="option-card__body">
        {option.image ? (
          <img className="option-card__image" src={option.image} alt="" loading="lazy" />
        ) : (
          <div className="option-card__image option-card__image--placeholder" aria-hidden="true" />
        )}
        <div className="option-card__top">
          {option.brand && <span className="option-card__brand">{option.brand}</span>}
          {isTopPick && <span className="option-card__tag">Top pick</span>}
        </div>
        <p className="option-card__desc">{option.description}</p>
        <div className="option-card__price">${Number(option.price).toFixed(2)}</div>
        <div className="option-card__scores">
          {nutriVar && (
            <span
              className="score-badge"
              style={{ "--badge-color": `var(${nutriVar})` }}
              title="Nutri-Score"
            >
              {nutriLetter}
            </span>
          )}
          {option.novaGroup != null && (
            <span
              className={`score-badge score-badge--nova${option.novaGroup >= 4 ? " score-badge--nova-warn" : ""}`}
              title="NOVA processing group"
            >
              NOVA {option.novaGroup} · {NOVA_LABEL[option.novaGroup] || "unknown"}
            </span>
          )}
          {option.proteinPer100g != null && (
            <span className="score-badge score-badge--macro" title="Protein per 100g">
              {option.proteinPer100g}g protein
            </span>
          )}
          {option.caloriesPer100g != null && (
            <span className="score-badge score-badge--macro" title="Calories per 100g">
              {option.caloriesPer100g} kcal
            </span>
          )}
        </div>
        {option.dataFlag && <p className="option-card__flag">{option.dataFlag}</p>}
      </div>
    </label>
  );
}
