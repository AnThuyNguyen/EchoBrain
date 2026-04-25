import { useState, useEffect } from 'react';

function ConceptScreen({ concept, onSkip, onComplete }) {
  const COUNTDOWN_SECS = 5;
  const RECORD_SECS = 60;
  const RING_SIZE = 164;
  const RING_CENTER = RING_SIZE / 2;
  const RING_RADIUS = 62;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const [mode, setMode] = useState('idle'); // 'idle' | 'countdown' | 'recording'
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [recordTime, setRecordTime] = useState(RECORD_SECS);

  useEffect(() => {
    if (mode !== 'countdown') return;
    if (countdown <= 0) {
      setMode('recording');
      setRecordTime(RECORD_SECS);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, countdown]);

  useEffect(() => {
    if (mode !== 'recording') return;
    if (recordTime <= 0) {
      onComplete('User explanation here');
      return;
    }
    const t = setTimeout(() => setRecordTime((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, recordTime, onComplete]);

  const handleClick = () => {
    if (mode === 'idle') {
      setCountdown(COUNTDOWN_SECS);
      setMode('countdown');
    } else if (mode === 'recording') {
      onComplete('User explanation here');
    }
  };

  const progress =
    mode === 'recording'
      ? ((RECORD_SECS - recordTime) / RECORD_SECS) * 100
      : 0;
  const progressFraction = progress / 100;

  const isRecording = mode === 'recording';
  const buttonBase =
    'flex h-28 w-28 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 active:scale-95';
  const buttonColor = isRecording
    ? 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400'
    : 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400';

  const secondTicks = Array.from({ length: RECORD_SECS }, (_, second) => {
    const angle = (second / RECORD_SECS) * 2 * Math.PI - Math.PI / 2;
    const isMajorSecond = second % 5 === 0;
    const outer = RING_RADIUS + 14;
    const inner = RING_RADIUS + (isMajorSecond ? 2 : 6);

    return {
      second,
      isMajorSecond,
      x1: RING_CENTER + outer * Math.cos(angle),
      y1: RING_CENTER + outer * Math.sin(angle),
      x2: RING_CENTER + inner * Math.cos(angle),
      y2: RING_CENTER + inner * Math.sin(angle),
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Tell me about
      </p>

      <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
        {concept}
      </h1>

      <div className="relative flex h-44 w-44 items-center justify-center">
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          aria-hidden="true"
        >
          <circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke={isRecording ? '#374151' : 'transparent'}
            strokeWidth="20"
          />


          <circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            fill="none"
            stroke="#3bf689"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={isRecording ? RING_CIRCUMFERENCE * (1 - progressFraction) : RING_CIRCUMFERENCE}
            transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        <button
          type="button"
          onClick={handleClick}
          disabled={mode === 'countdown'}
          className={`${buttonBase} ${buttonColor} ${mode === 'idle' ? 'hover:scale-105' : ''} z-10`}
          aria-label={
            isRecording ? 'Stop Recording' : mode === 'countdown' ? `Starting in ${countdown}` : 'Start Test'
          }
        >
          {mode === 'countdown' ? (
            <span className="text-4xl font-bold text-white">{countdown}</span>
          ) : isRecording ? (
            <span className="text-lg font-bold tracking-widest text-white">FINISH</span>
          ) : null}
        </button>
      </div>


    </div>
  );
}

export default ConceptScreen;
