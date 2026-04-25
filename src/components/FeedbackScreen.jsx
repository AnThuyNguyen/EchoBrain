function FeedbackScreen({ concept, transcript, onAgain, onNextConcept }) {
  return (
    <div className="flex flex-col gap-8 text-center sm:text-left">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
          Feedback
        </p>

        <h2 className="text-3xl font-bold">{concept}</h2>

        <p className="rounded-xl border border-teal-100 bg-white/80 p-4 text-sm text-[var(--text-soft)]">
          Transcript: {transcript}
        </p>

        <p className="text-lg leading-relaxed text-[var(--text-main)]">
          Great work! You got A, B, C correct. However, the concept also
          includes X and Y.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-xl border border-[var(--accent)] px-5 py-4 text-base font-semibold text-[var(--accent)] transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
        >
          Again
        </button>

        <button
          type="button"
          onClick={onNextConcept}
          className="rounded-xl bg-[var(--accent)] px-5 py-4 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
        >
          Next concept
        </button>
      </div>
    </div>
  );
}

export default FeedbackScreen;
