import { useEffect, useState } from 'react';

function CountdownScreen({ seconds, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timerId = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [timeLeft, onComplete]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Get ready
      </p>

      <div className="flex h-44 w-44 items-center justify-center rounded-full border-8 border-[var(--accent)]/20 bg-[#1a1a1a] text-7xl font-extrabold text-[var(--accent)] shadow-inner">
        {timeLeft}
      </div>

      <p className="text-base text-[var(--text-soft)]">
        Starting recording in a moment...
      </p>
    </div>
  );
}

export default CountdownScreen;
