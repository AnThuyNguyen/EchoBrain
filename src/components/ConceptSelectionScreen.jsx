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
            <p className="text-base font-bold text-[var(--text-main)]">⭐ {concept.name}</p>
            {(() => {
              const [intro, ...bulletLines] = concept.description.split('\n');
              const bullets = bulletLines.map((l) => l.replace(/^[-–•]\s*/, '').trim()).filter(Boolean);
              return (
                <div className="mt-1.5 space-y-1.5">
                  {intro && <p className="text-sm leading-snug text-[var(--text-soft)]">{intro}</p>}
                  {bullets.length > 0 && (
                    <ul className="space-y-0.5 pl-1">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-[var(--text-soft)]">
                          <span className="shrink-0 text-[var(--accent)]">–</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConceptSelectionScreen;
