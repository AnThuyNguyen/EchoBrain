function ConceptScreen({ concept, onTest, onSkip }) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Current concept
      </p>

      <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
        {concept}
      </h1>

      <button
        type="button"
        onClick={onTest}
        className="w-full max-w-md rounded-2xl bg-[var(--accent)] px-8 py-5 text-2xl font-semibold text-white transition hover:scale-[1.01] hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
      >
        Start Test
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-soft)] underline decoration-dotted underline-offset-4 transition hover:text-[var(--text-main)]"
      >
        Skip
      </button>
    </div>
  );
}

export default ConceptScreen;
