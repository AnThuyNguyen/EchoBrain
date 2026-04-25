import { useState } from 'react';

function RecordingScreen({ concept, onComplete }) {
  const [isRecording, setIsRecording] = useState(false);

  const handleMicClick = () => {
    if (!isRecording) {
      setIsRecording(true);
      return;
    }

    setIsRecording(false);
    onComplete('User explanation here');
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Explain this concept
      </p>

      <h2 className="text-balance text-2xl font-semibold sm:text-3xl">{concept}</h2>

      <button
        type="button"
        onClick={handleMicClick}
        className={`flex h-40 w-40 items-center justify-center rounded-full text-5xl font-bold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-4 ${
          isRecording
            ? 'animate-pulse bg-[var(--warn)] focus-visible:ring-orange-200'
            : 'bg-[var(--accent)] hover:scale-105 focus-visible:ring-teal-200'
        }`}
        aria-pressed={isRecording}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? 'Stop' : 'Mic'}
      </button>

      <p className="text-base text-[var(--text-soft)]">
        {isRecording ? 'Recording... Tap to stop.' : 'Tap the mic to start recording.'}
      </p>
    </div>
  );
}

export default RecordingScreen;
