import { useState, useEffect } from 'react';

function ConceptScreen({ concept, onSkip, onComplete }) {
  const COUNTDOWN_SECS = 5;
  const RECORD_SECS = 60;

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

  const isRecording = mode === 'recording';
  const buttonBase =
    'flex h-28 w-28 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 active:scale-95';
  const buttonColor = isRecording
    ? 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400'
    : 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400';

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Current concept
      </p>

      <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
        {concept}
      </h1>

      <button
        type="button"
        onClick={handleClick}
        disabled={mode === 'countdown'}
        className={`${buttonBase} ${buttonColor} ${mode === 'idle' ? 'hover:scale-105' : ''}`}
        aria-label={
          isRecording ? 'Stop Recording' : mode === 'countdown' ? `Starting in ${countdown}` : 'Start Test'
        }
      >
        {mode === 'countdown' ? (
          <span className="text-4xl font-bold text-white">{countdown}</span>
        ) : isRecording ? (
          <span className="text-lg font-bold tracking-widest text-white">STOP</span>
        ) : null}
      </button>

      {/* reserved space for progress bar — always rendered to prevent layout shift */}
      <div className={`w-full max-w-xs overflow-hidden rounded-full transition-colors duration-300 ${isRecording ? 'bg-gray-700' : 'bg-transparent'}`} style={{ height: '6px' }}>
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-1000"
          style={{ width: isRecording ? `${progress}%` : '0%' }}
        />
      </div>

      {/* fixed-height status text to prevent jump */}
      <p className="h-5 text-sm text-[var(--text-soft)]">
        {mode === 'idle' && 'Tap to start recording'}
        {mode === 'countdown' && 'Get ready…'}
        {mode === 'recording' && 'Recording — tap to stop'}
      </p>

    </div>
  );
}

export default ConceptScreen;
