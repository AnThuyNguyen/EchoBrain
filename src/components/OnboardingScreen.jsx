import { useRef } from 'react';

function OnboardingScreen({ fileName, onFileSelected, onGenerateFromMaterial }) {
  const inputRef = useRef(null);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    onFileSelected(file?.name || '');
  };

  return (
    
    <div className="flex flex-col items-center gap-8 text-center">
      <h1 className="text-balance text-6xl font-bold leading-tight sm:text-8xl">EchoBrain</h1>

      <h2 className="text-balance text-xl font-semibold leading-tight">Test your memory</h2>

      <p className="max-w-xl text-base leading-relaxed text-[var(--text-soft)]">
        Choose one path: upload study material or use the AI chatbox to generate concepts.
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt,.doc,.docx,.ppt,.pptx"
      />

      <button
        type="button"
        onClick={handleUploadClick}
        className="w-full max-w-md rounded-2xl border-2 border-dashed border-[var(--accent)] px-8 py-4 text-lg font-semibold text-[var(--accent)] transition hover:bg-blue-950"
      >
        Upload Study Material
      </button>

      <p className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-[var(--text-soft)]">
        Selected: {fileName || 'No file selected yet'}
      </p>

      <button
        type="button"
        onClick={onGenerateFromMaterial}
        className="w-full max-w-md rounded-2xl bg-[var(--accent)] px-8 py-4 text-xl font-semibold text-white transition hover:bg-[var(--accent-strong)]"
      >
        Generate Concepts From Study Material
      </button>

      <p className="text-sm text-[var(--text-soft)]">
        Or use the AI chatbox action on the right to generate concepts from your prompts.
      </p>
    </div>
  );
}

export default OnboardingScreen;
