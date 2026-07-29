import { useState } from "react";

export default function TagInput({ values, onChange, placeholder, tagClassName = "tag" }) {
  const [input, setInput] = useState("");

  function addTag() {
    const value = input.trim().replace(/,$/, "");
    if (!value) return;
    onChange([...values, value]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && input === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeTag(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="tag-input">
      {values.map((value, i) => (
        <span className={tagClassName} key={`${value}-${i}`}>
          {value}
          <button
            type="button"
            className="tag__remove"
            onClick={() => removeTag(i)}
            aria-label={`Remove ${value}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-input__field"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={values.length === 0 ? placeholder : "add another…"}
      />
    </div>
  );
}
