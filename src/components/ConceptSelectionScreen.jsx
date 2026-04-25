function ConceptSelectionScreen({ concepts, sourceLabel, onChooseConcept }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center sm:text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
          Concept List
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">
          Choose A Concept To Test
        </h1>
        <p className="text-sm text-[var(--text-soft)]">Generated from: {sourceLabel}</p>
      </div>

      <div className="grid gap-3">
        {concepts.map((concept, index) => (
          <button
            key={`${concept}-${index}`}
            type="button"
            onClick={() => onChooseConcept(index)}
            className="rounded-2xl border border-gray-600 bg-[#2a2a2a] px-5 py-4 text-left text-base font-semibold text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[#333]"
          >
            {concept}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConceptSelectionScreen;
