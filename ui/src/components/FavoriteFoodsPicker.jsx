import { FAVORITE_FOOD_OPTIONS } from "../lib/preferences";

export default function FavoriteFoodsPicker({ value, onChange }) {
  const selected = new Map(value.map((f) => [f.name, f.qty]));

  function toggle(name) {
    if (selected.has(name)) {
      onChange(value.filter((f) => f.name !== name));
    } else {
      onChange([...value, { name, qty: 1 }]);
    }
  }

  function setQty(name, qty) {
    const clamped = Math.max(1, Math.min(9, qty));
    onChange(value.map((f) => (f.name === name ? { ...f, qty: clamped } : f)));
  }

  return (
    <div className="favorite-foods">
      {FAVORITE_FOOD_OPTIONS.map((name) => {
        const qty = selected.get(name);
        const isSelected = qty != null;
        return (
          <div key={name} className={`favorite-food${isSelected ? " favorite-food--selected" : ""}`}>
            <button
              type="button"
              className="favorite-food__name"
              onClick={() => toggle(name)}
            >
              {name}
            </button>
            {isSelected && (
              <div className="favorite-food__qty">
                <button
                  type="button"
                  onClick={() => setQty(name, qty - 1)}
                  aria-label={`Decrease ${name} quantity`}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(name, qty + 1)}
                  aria-label={`Increase ${name} quantity`}
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
