function ConceptSelectionScreen({ concepts, sourceLabel, onChooseConcept }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-balance text-3xl font-bold leading-tight sm:text-4xl">
          Choose A Concept To Test
        </h1>
        <p className="text-sm text-[var(--text-soft)]">Generated from: {sourceLabel}</p>
      </div>

      <div className="grid gap-3">
        {concepts.map((concept, index) => (
          <button
            key={`${concept.name}-${index}`}
            type="button"
            onClick={() => onChooseConcept(index)}
            className="rounded-2xl border border-gray-600 bg-[#2a2a2a] px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[#333]"
          >
            <p className="text-base font-bold text-[var(--text-main)]">{concept.name}</p>
            <p className="mt-1 text-sm text-[var(--text-soft)]">{concept.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConceptSelectionScreen;
