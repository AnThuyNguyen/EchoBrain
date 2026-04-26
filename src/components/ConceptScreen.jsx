import { useCallback, useEffect, useRef, useState } from 'react';
import PulsatingButton from './PulsatingButton';

function ConceptScreen({ concept, onComplete }) {
  const COUNTDOWN_SECS = 3;
  const RECORD_SECS = 60;
  const ARMING_MS = 800;
  const RING_SIZE = 164;
  const RING_CENTER = RING_SIZE / 2;
  const RING_RADIUS = 62;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const [mode, setMode] = useState('idle'); // 'idle' | 'countdown' | 'arming' | 'recording'
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [recordTime, setRecordTime] = useState(RECORD_SECS);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (mode !== 'countdown') return;
    if (countdown <= 0) {
      setMode('arming');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, countdown]);

  useEffect(() => {
    if (mode !== 'arming') return;
    const t = setTimeout(() => {
      setRecordTime(RECORD_SECS);
      setMode('recording');
    }, ARMING_MS);
    return () => clearTimeout(t);
  }, [mode]);

  // Start microphone capture when recording begins
  useEffect(() => {
    if (mode !== 'recording') return;

    let stream;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        stream = s;
        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(s, { mimeType });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start();
      })
      .catch((err) => {
        console.error('Microphone access denied:', err);
      });

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  const finishRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      onComplete(null);
      return;
    }
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onComplete(blob);
    };
    recorder.stop();
  }, [onComplete]);

  useEffect(() => {
    if (mode !== 'recording') return;
    if (recordTime <= 0) {
      finishRecording();
      return;
    }
    const t = setTimeout(() => setRecordTime((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, recordTime, finishRecording]);

  const handleClick = () => {
    if (mode === 'idle') {
      setCountdown(COUNTDOWN_SECS);
      setMode('countdown');
    } else if (mode === 'recording') {
      finishRecording();
    }
  };

  const progress =
    mode === 'recording'
      ? ((RECORD_SECS - recordTime) / RECORD_SECS) * 100
      : 0;
  const progressFraction = progress / 100;

  const isRecording = mode === 'recording';
  const isArming = mode === 'arming';
  const buttonBase =
    'flex h-28 w-28 items-center justify-center rounded-full transition-[background-color,transform,box-shadow] duration-700 ease-out focus-visible:outline-none focus-visible:ring-4 active:scale-95';
  const buttonColor = isRecording
    ? 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400'
    : 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400';

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const timerLabel =
    mode === 'recording'
      ? formatTimer(recordTime)
      : mode === 'countdown'
      ? formatTimer(countdown)
      : mode === 'arming'
      ? '0:00'
      : '0:00';

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Tell me about
      </p>

      <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
        {concept.name}
      </h1>

      <div className="relative flex h-44 w-44 items-center justify-center">
        <div
          className={`absolute left-1/2 top-1 z-20 h-10 w-1 -translate-x-1/2 origin-bottom rounded-full bg-yellow-400 transition-all duration-700 ease-out ${
            isArming || isRecording ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
        />

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
            stroke="#facc15"
            strokeWidth="10"
            strokeLinecap="butt"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={isRecording ? RING_CIRCUMFERENCE * (1 - progressFraction) : RING_CIRCUMFERENCE}
            transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {mode === 'idle' ? (
          <PulsatingButton
            type="button"
            onClick={handleClick}
            variant="ripple"
            distance="14px"
            duration="1.6s"
            pulseColor="rgba(239, 68, 68, 0.55)"
            className={`${buttonBase} ${buttonColor} hover:scale-105 z-10`}
            aria-label="Start Test"
          />
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={mode === 'countdown' || isArming}
            className={`${buttonBase} ${buttonColor} z-10`}
            aria-label={
              isRecording
                ? 'Stop Recording'
                : mode === 'countdown'
                ? `Starting in ${countdown}`
                : isArming
                ? 'Starting Recording'
                : 'Start Test'
            }
          >
            {mode === 'countdown' ? (
              <span className="text-4xl font-bold text-white">{countdown}</span>
            ) : isRecording ? (
              <span className="text-lg font-bold tracking-widest text-white">FINISH</span>
            ) : isArming ? (
              <span className="text-xs font-semibold tracking-[0.2em] text-white">...</span>
            ) : null}
          </button>
        )}
      </div>
      <p className={`h-5 text-sm font-semibold tracking-[0.15em] ${isRecording ? 'text-yellow-400' : 'text-transparent'}`}>
        {timerLabel}
      </p>
    </div>
  );
}

export default ConceptScreen;
