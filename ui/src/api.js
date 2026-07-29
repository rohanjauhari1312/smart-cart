const BASE_URL = "https://n8n-production-31ef.up.railway.app/webhook";
const SUGGESTIONS_URL = `${BASE_URL}/1b147e97-bf8a-4168-a599-3ef86bf0b7e0`;
const SELECTION_URL = `${BASE_URL}/f6f6f4c0-1ba0-4316-98b4-39cfa9f969ec`;

// The agent responds with raw text that should be a single JSON object, but
// LLM output occasionally comes back with stray whitespace or leading/trailing
// prose around the braces. Fall back to extracting the outermost {...} span
// before giving up, rather than surfacing a raw parse error to the user.
function parseAgentJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end < start) {
      throw new Error("The backend didn't return a valid response. Try again in a moment.");
    }
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      throw new Error("The backend didn't return a valid response. Try again in a moment.");
    }
  }
}

async function postJSON(url, payload) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Couldn't reach the backend. Check your connection and try again.");
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Backend returned an error (${res.status}). Try again in a moment.`);
  }

  return parseAgentJSON(text);
}

export function getSuggestions({ request, userId, diet }) {
  return postJSON(SUGGESTIONS_URL, { request, userId, diet });
}

export function submitSelection({ userId, requestText, budget, suggestions, picks }) {
  return postJSON(SELECTION_URL, { userId, requestText, budget, suggestions, picks });
}
