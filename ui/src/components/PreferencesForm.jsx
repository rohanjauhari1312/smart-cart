import { useState } from "react";
import TagInput from "./TagInput";
import FavoriteFoodsPicker from "./FavoriteFoodsPicker";
import { DIETS, GOALS, setStoredPreferences } from "../lib/preferences";

export default function PreferencesForm({ initial, onSubmit }) {
  const [diet, setDiet] = useState(initial?.diet ?? "veg");
  const [likes, setLikes] = useState(initial?.likes ?? []);
  const [dislikes, setDislikes] = useState(initial?.dislikes ?? []);
  const [goal, setGoal] = useState(initial?.goal ?? "none");
  const [goalNotes, setGoalNotes] = useState(initial?.goalNotes ?? "");
  const [favoriteFoods, setFavoriteFoods] = useState(initial?.favoriteFoods ?? []);

  function handleSubmit(e) {
    e.preventDefault();
    const dietLabel = DIETS.find((d) => d.value === diet)?.label ?? diet;
    const goalLabel = GOALS.find((g) => g.value === goal)?.label ?? goal;
    const prefs = { diet, dietLabel, likes, dislikes, goal, goalLabel, goalNotes: goalNotes.trim(), favoriteFoods };
    setStoredPreferences(prefs);
    onSubmit(prefs);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <div className="request-form__intro">
        <h1>What do you eat?</h1>
        <p className="request-form__subtitle">
          A one-time setup so suggestions can be scored against your diet and taste from the start.
          You can change this anytime.
        </p>
      </div>

      <label className="field">
        <span className="field__label">Diet</span>
        <select value={diet} onChange={(e) => setDiet(e.target.value)}>
          {DIETS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span className="field__label">Goal</span>
        <div className="chip-row">
          {GOALS.map((g) => (
            <button
              type="button"
              key={g.value}
              className={`chip${goal === g.value ? " chip--selected" : ""}`}
              onClick={() => setGoal(g.value)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <span className="field__hint">Nudges which options get ranked higher — a real pick still needs a real label to back it up</span>
      </div>

      <label className="field">
        <span className="field__label">Or describe it yourself</span>
        <input
          value={goalNotes}
          onChange={(e) => setGoalNotes(e.target.value)}
          placeholder="e.g. training for a marathon, cutting sugar…"
        />
        <span className="field__hint">Optional — used alongside or instead of the goal above</span>
      </label>

      <label className="field">
        <span className="field__label">Foods you like</span>
        <TagInput values={likes} onChange={setLikes} placeholder="spicy food, mango, oat milk…" />
        <span className="field__hint">Optional — helps the tradeoff reasoning lean toward what you'd actually pick</span>
      </label>

      <label className="field">
        <span className="field__label">Foods to avoid</span>
        <TagInput values={dislikes} onChange={setDislikes} placeholder="shellfish, peanuts, cilantro…" tagClassName="tag tag--avoid" />
        <span className="field__hint">Allergies, dislikes, anything to steer away from</span>
      </label>

      <div className="field">
        <span className="field__label">Your usual order</span>
        <FavoriteFoodsPicker value={favoriteFoods} onChange={setFavoriteFoods} />
        <span className="field__hint">
          Pick what you buy regularly and set how many — these auto-fill your next order so you don't have to type them in every time
        </span>
      </div>

      <button type="submit" className="btn btn--primary btn--full">
        Continue
      </button>
    </form>
  );
}
