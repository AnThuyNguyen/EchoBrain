import { useEffect, useState } from 'react';

function RecordingScreen({ concept, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    setTimeLeft(60);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete('User explanation here');
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Explain this concept
      </p>

      <h2 className="text-balance text-2xl font-semibold sm:text-3xl">{concept}</h2>

      <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-[var(--warn)]/20 bg-[var(--warn)]/10 text-6xl font-extrabold text-[var(--warn)] shadow-inner animate-pulse">
        {formatTime(timeLeft)}
      </div>

      <p className="text-base text-[var(--text-soft)]">
        Recording in progress... {formatTime(timeLeft)} remaining
      </p>

      <button
        type="button"
        onClick={() => onComplete('User explanation here')}
        className="rounded-xl bg-[var(--warn)] px-6 py-3 text-lg font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
      >
        Stop Record
      </button>
    </div>
  );
}

export default RecordingScreen;
