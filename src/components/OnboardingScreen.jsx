import { useRef } from 'react';

function OnboardingScreen({ fileName, onFileSelected, onGenerateFromMaterial, isGenerating }) {
  const inputRef = useRef(null);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-xs leading-relaxed text-[var(--text-soft)] sm:text-sm">
        Upload study material or use the AI chatbox to generate concepts.
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt,.doc,.docx"
      />

      <button
        type="button"
        onClick={handleUploadClick}
        disabled={isGenerating}
        className="w-full max-w-md rounded-xl border-2 border-dashed border-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent)] transition hover:bg-blue-950 disabled:opacity-50"
      >
        Upload Study Material
        <p className="mt-1 rounded-lg bg-gray-800 px-3 py-1 text-xs text-[var(--text-soft)]">
          {fileName || 'No file selected'}
        </p>
      </button>

      {fileName && (
        <button
          type="button"
          onClick={onGenerateFromMaterial}
          disabled={isGenerating}
          className="btn-slide-up w-full max-w-md rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? 'Extracting Concepts…' : 'Generate Concepts'}
        </button>
      )}
    </div>
  );
}

export default OnboardingScreen;
