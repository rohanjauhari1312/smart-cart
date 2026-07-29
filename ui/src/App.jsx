import { useState } from "react";
import "./App.css";
import { getSuggestions, submitSelection } from "./api";
import { getStoredPreferences } from "./lib/preferences";
import PreferencesForm from "./components/PreferencesForm";
import RequestForm from "./components/RequestForm";
import LoadingState from "./components/LoadingState";
import SuggestionsView from "./components/SuggestionsView";
import ConfirmationView from "./components/ConfirmationView";

const SUGGESTIONS_STAGES = [
  { label: "Understanding your request", at: 0 },
  { label: "Searching real Kroger inventory for each category", at: 3 },
  { label: "Checking nutrition labels and diet safety", at: 10 },
  { label: "Ranking options against your budget and preferences", at: 22 },
];

const CART_STAGES = [
  { label: "Saving this session to Supabase", at: 0 },
  { label: "Writing the selected items to your real Kroger cart", at: 3 },
];

function ErrorState({ message, onRetry, onBack, backLabel }) {
  return (
    <div className="error-state">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      <div className="error-state__actions">
        {onBack && (
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            {backLabel}
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [preferences, setPreferences] = useState(getStoredPreferences);
  const [step, setStep] = useState("preferences");
  const [requestPayload, setRequestPayload] = useState(null);
  const [suggestionsData, setSuggestionsData] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [error, setError] = useState(null);

  function handlePreferencesSubmit(prefs) {
    setPreferences(prefs);
    setStep("form");
  }

  async function fetchSuggestions(payload) {
    setStep("loadingSuggestions");
    setError(null);
    try {
      const data = await getSuggestions({
        request: payload.requestText,
        userId: payload.userId,
        diet: payload.diet,
      });
      setSuggestionsData(data);
      setStep("suggestions");
    } catch (err) {
      setError(err.message);
      setStep("errorSuggestions");
    }
  }

  function handleRequestSubmit(payload) {
    setRequestPayload(payload);
    fetchSuggestions(payload);
  }

  async function handlePicksSubmit(picksArray) {
    setError(null);
    setStep("loadingCart");
    try {
      const data = await submitSelection({
        userId: requestPayload.userId,
        requestText: requestPayload.requestText,
        budget: requestPayload.budget,
        suggestions: suggestionsData.suggestions,
        picks: picksArray,
      });
      setConfirmationData(data);
      setStep("confirmation");
    } catch (err) {
      setError(err.message);
      setStep("errorCart");
    }
  }

  function startOver() {
    setRequestPayload(null);
    setSuggestionsData(null);
    setConfirmationData(null);
    setError(null);
    setStep("form");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header__mark">Smart Cart</span>
        <div className="app-header__right">
          <span className="app-header__tag">real cart writes</span>
          <img src="/kroger.jpg" alt="Kroger" className="app-header__logo" />
        </div>
      </header>

      <main className="app-main">
        {step === "preferences" && (
          <PreferencesForm initial={preferences} onSubmit={handlePreferencesSubmit} />
        )}

        {step === "form" && (
          <RequestForm
            preferences={preferences}
            onEditPreferences={() => setStep("preferences")}
            onSubmit={handleRequestSubmit}
          />
        )}

        {step === "loadingSuggestions" && (
          <LoadingState
            title="Building your suggestions"
            estimateText="Typically 15–90 seconds depending on how many categories are involved."
            stages={SUGGESTIONS_STAGES}
          />
        )}

        {step === "errorSuggestions" && (
          <ErrorState
            message={error}
            onRetry={() => fetchSuggestions(requestPayload)}
            onBack={startOver}
            backLabel="Edit request"
          />
        )}

        {step === "suggestions" && suggestionsData && (
          <SuggestionsView
            data={suggestionsData}
            onSubmit={handlePicksSubmit}
            onStartOver={startOver}
          />
        )}

        {step === "loadingCart" && (
          <LoadingState
            title="Adding to your cart"
            estimateText="Usually under a minute."
            stages={CART_STAGES}
          />
        )}

        {step === "errorCart" && (
          <ErrorState
            message={error}
            onRetry={() => setStep("suggestions")}
            onBack={startOver}
            backLabel="Start over"
          />
        )}

        {step === "confirmation" && confirmationData && (
          <ConfirmationView data={confirmationData} onStartOver={startOver} />
        )}
      </main>
    </div>
  );
}
