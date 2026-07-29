import { useState } from "react";
import TagInput from "./TagInput";
import CategoryIcon, { categoriesForDiet } from "./CategoryIcons";
import { GOALS } from "../lib/preferences";

function getStoredUserId() {
  const existing = localStorage.getItem("grocer-agent-user-id");
  if (existing) return existing;
  const generated = `demo-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("grocer-agent-user-id", generated);
  return generated;
}

function buildRequestText({ items, budget, preferences, favoriteQtyMap }) {
  const itemsWithQty = items.map((item) => {
    const qty = favoriteQtyMap.get(item.toLowerCase());
    return qty && qty > 1 ? `${item} (x${qty})` : item;
  });
  let text = `Order groceries: ${itemsWithQty.join(", ")}, under $${budget}.`;
  if (preferences.likes.length > 0) {
    text += ` Prefers: ${preferences.likes.join(", ")}.`;
  }
  if (preferences.dislikes.length > 0) {
    text += ` Avoid: ${preferences.dislikes.join(", ")}.`;
  }
  if (preferences.goal && preferences.goal !== "none") {
    const note = GOALS.find((g) => g.value === preferences.goal)?.note;
    text += note ? ` Goal: ${preferences.goalLabel} — ${note}.` : ` Goal: ${preferences.goalLabel}.`;
  }
  if (preferences.goalNotes) {
    text += ` Also: ${preferences.goalNotes}.`;
  }
  return text;
}

export default function RequestForm({ preferences, onEditPreferences, onSubmit }) {
  const favoriteFoods = preferences.favoriteFoods ?? [];
  const favoriteQtyMap = new Map(favoriteFoods.map((f) => [f.name.toLowerCase(), f.qty]));

  const [items, setItems] = useState(() => favoriteFoods.map((f) => f.name));
  const [budget, setBudget] = useState("");
  const [userId, setUserId] = useState(getStoredUserId);

  function addSuggestedCategory(label) {
    if (items.includes(label)) return;
    setItems((prev) => [...prev, label]);
  }

  const availableCategories = categoriesForDiet(preferences.diet);
  const budgetNumber = Number(budget);
  const canSubmit = items.length > 0 && budget !== "" && budgetNumber > 0;

  const requestText = canSubmit
    ? buildRequestText({ items, budget: budgetNumber, preferences, favoriteQtyMap })
    : "";

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    localStorage.setItem("grocer-agent-user-id", userId);
    onSubmit({ requestText, budget: budgetNumber, diet: preferences.diet, userId });
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <div className="request-form__intro">
        <h1>What do you need this week?</h1>
        <p className="request-form__subtitle">
          Add a few items and a budget. The system searches real Kroger inventory,
          scores every candidate on nutrition and diet safety, and comes back with
          a few ranked options per category — it doesn't decide for you.
        </p>
      </div>

      <div className="prefs-summary">
        <span>
          <strong>{preferences.dietLabel}</strong>
          {preferences.goal && preferences.goal !== "none" && <> · goal: {preferences.goalLabel}</>}
          {preferences.goalNotes && <> ({preferences.goalNotes})</>}
          {preferences.likes.length > 0 && <> · likes {preferences.likes.join(", ")}</>}
          {preferences.dislikes.length > 0 && <> · avoids {preferences.dislikes.join(", ")}</>}
        </span>
        <button type="button" className="link-btn" onClick={onEditPreferences}>
          Edit preferences
        </button>
      </div>

      <div className="field">
        <span className="field__label">Quick add</span>
        <div className="chip-row">
          {availableCategories.map((cat) => (
            <button
              type="button"
              key={cat.label}
              className="chip"
              onClick={() => addSuggestedCategory(cat.label)}
            >
              <CategoryIcon name={cat.icon} />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Items</span>
        <TagInput values={items} onChange={setItems} placeholder="ramen, dumplings, oat milk…" />
        <span className="field__hint">
          {favoriteFoods.length > 0
            ? "Auto-filled from your usual order — edit or remove anything"
            : "Press Enter or comma to add each item"}
        </span>
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Budget</span>
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="40"
            />
          </div>
        </label>

        <label className="field">
          <span className="field__label">User ID</span>
          <input
            className="field__mono"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
      </div>

      {requestText && (
        <div className="request-preview">
          <span className="request-preview__label">Sent to the Intent Agent as</span>
          <code>{requestText}</code>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--full" disabled={!canSubmit}>
        Get suggestions
      </button>
    </form>
  );
}
