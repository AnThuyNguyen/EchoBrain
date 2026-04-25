function FeedbackScreen({ concept, transcript, onAgain, concepts, currentConceptIndex, onSelectConcept, onBackToList }) {
  const otherConcepts = concepts.filter((_, index) => index !== currentConceptIndex);

  return (
    <div className="flex flex-col gap-8 text-center sm:text-left">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
          Feedback
        </p>

        <h2 className="text-3xl font-bold">{concept}</h2>

        <p className="rounded-xl border border-gray-600 bg-[#2a2a2a] p-4 text-sm text-[var(--text-soft)]">
          Transcript: {transcript}
        </p>

        <p className="text-lg leading-relaxed text-[var(--text-main)]">
          Great work! You got A, B, C correct. However, the concept also
          includes X and Y.
        </p>
      </div>

      <button
        type="button"
        onClick={onAgain}
        className="rounded-xl border border-[var(--accent)] px-5 py-4 text-base font-semibold text-[var(--accent)] transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        Try Again
      </button>

      {otherConcepts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
            Other Concepts
          </p>
          <div className="grid gap-2">
            {otherConcepts.map((otherConcept, idx) => {
              const actualIndex = concepts.indexOf(otherConcept);
              return (
                <button
                  key={`${otherConcept}-${idx}`}
                  type="button"
                  onClick={() => onSelectConcept(actualIndex)}
                  className="rounded-xl border border-gray-600 bg-[#2a2a2a] px-4 py-3 text-left text-base font-semibold text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[#333]"
                >
                  {otherConcept}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBackToList}
        className="rounded-xl border border-[var(--accent)] px-5 py-4 text-base font-semibold text-[var(--accent)] transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
      >
        Back to Concept List
      </button>
    </div>
  );
}

export default FeedbackScreen;
