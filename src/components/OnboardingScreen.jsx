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
    <>
      <div className="flex flex-col items-center gap-8 text-center">
      <p className="max-w-xl text-base leading-relaxed text-[var(--text-soft)]">
        Upload study material or use the AI chatbox to generate concepts.
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
        <p className="rounded-xl bg-gray-800 px-4 py-2 text-sm text-[var(--text-soft)]">
          {fileName || ''}
        </p>
      </button>

        <button
          type="button"
          onClick={onGenerateFromMaterial}
          className="w-full max-w-md rounded-2xl bg-[var(--accent)] px-8 py-4 text-xl font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Generate Concepts
        </button>
      </div>
    </>
  );
}

export default OnboardingScreen;
