function FeedbackScreen({ concept, transcript, aiFeedback, isAnalyzing, onAgain, concepts, currentConceptIndex, onSelectConcept, onBackToList }) {
  const otherConcepts = concepts.filter((_, index) => index !== currentConceptIndex);

  const renderFeedback = () => {
    if (isAnalyzing) {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-600 bg-[#2a2a2a] p-4">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="text-sm text-[var(--text-soft)]">Analysing your explanation…</span>
        </div>
      );
    }

    if (!aiFeedback) return null;

    const { correctPoints = [], missingPoints = [], summary = '' } = aiFeedback;

    return (
      <div className="space-y-3">
        {correctPoints.length > 0 && (
          <div className="rounded-xl border border-green-800 bg-green-950/40 p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-green-400">What you got right</p>
            <ul className="space-y-1">
              {correctPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text-main)]">
                  <span className="mt-0.5 shrink-0 text-green-400">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingPoints.length > 0 && (
          <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-3">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-yellow-400">What to add next time</p>
            <ul className="space-y-1">
              {missingPoints.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--text-main)]">
                  <span className="mt-0.5 shrink-0 text-yellow-400">→</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary && (
          <p className="text-sm leading-relaxed text-[var(--text-soft)]">{summary}</p>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-5 text-left md:grid-cols-[2fr_1fr]">
      <section className="flex min-h-[22rem] flex-col justify-between rounded-2xl border border-gray-700 bg-[#1b1b1b] p-5 sm:p-6">
        <div className="space-y-3">
          <p className="text-xl font-semibold tracking-[0.2em] text-[var(--text-soft)]">
            Great work explaining
          </p>

          <h2 className="text-3xl font-bold">{concept.name}</h2>

          <div className="rounded-xl border border-gray-600 bg-[#242424] p-4 text-sm text-[var(--text-soft)]">
            <span className="font-semibold text-white">Concept card definition: </span>
            <span className="whitespace-pre-line">{concept.description}</span>
          </div>

          {transcript ? (
            <p className="rounded-xl border border-gray-600 bg-[#2a2a2a] p-4 text-sm text-[var(--text-soft)]">
              <span className="font-semibold text-white">Your explanation: </span>{transcript}
            </p>
          ) : null}

          {renderFeedback()}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAgain}
            className="rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--text-main)] transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={onBackToList}
            className="rounded-xl border border-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--accent)] transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          >
            Back to Concept List
          </button>
        </div>
      </section>

      <section className="min-h-[22rem] rounded-2xl p-4 sm:p-5">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
          Tell me these as well!
        </p>

        {otherConcepts.length > 0 ? (
          <div className="h-[17rem] space-y-2 pr-1">
            {otherConcepts.map((otherConcept, idx) => {
              const actualIndex = concepts.findIndex((c) => c.name === otherConcept.name);
              return (
                <button
                  key={`${otherConcept.name}-${idx}`}
                  type="button"
                  onClick={() => onSelectConcept(actualIndex)}
                  className="rounded-lg border border-transparent bg-transparent px-3 py-2 text-left text-base font-semibold text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[#2a2a2a]"
                >
                  {otherConcept.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-soft)]">No other concepts yet.</p>
        )}
      </section>
    </div>
  );
}

export default FeedbackScreen;
