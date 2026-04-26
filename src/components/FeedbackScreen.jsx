function FeedbackScreen({ concept, transcript, onAgain, concepts, currentConceptIndex, onSelectConcept, onBackToList }) {
  const otherConcepts = concepts.filter((_, index) => index !== currentConceptIndex);

  return (
    <div className="grid gap-5 text-left md:grid-cols-[2fr_1fr]">
      <section className="flex min-h-[22rem] flex-col justify-between rounded-2xl border border-gray-700 bg-[#1b1b1b] p-5 sm:p-6">
        <div className="space-y-3">
          <p className="text-xl font-semibold tracking-[0.2em] text-[var(--text-soft)]">
            Great work explaining
          </p>

          <h2 className="text-3xl font-bold">{concept.name}</h2>

          <p className="rounded-xl border border-gray-600 bg-[#2a2a2a] p-4 text-sm text-[var(--text-soft)]">
            Transcript: {transcript}
          </p>

          <p className="text-lg leading-relaxed text-[var(--text-main)]">
            You got A, B, C correct. 
            However, the concept also includes X and Y.
          </p>
        </div>

        {/* left */}
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
                  className=" rounded-lg border border-transparent bg-transparent px-3 py-2 text-left text-base font-semibold text-[var(--accent)] transition hover:border-[var(--accent)] hover:bg-[#2a2a2a]"
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
