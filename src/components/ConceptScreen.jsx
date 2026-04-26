import { useCallback, useEffect, useRef, useState } from 'react';
import PulsatingButton from './PulsatingButton';

function ConceptScreen({ concept, onComplete, startRecordingSignal = 0, stopRecordingSignal = 0, isVoiceModeOn = false, onAudioBars, onRecordingStateChange }) {
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
  const [audioBars, setAudioBars] = useState(() => Array(18).fill(0.06));

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const countdownBeepContextRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastStartSignalRef = useRef(startRecordingSignal);
  const lastStopSignalRef = useRef(stopRecordingSignal);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const playCountdownBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!countdownBeepContextRef.current) {
        countdownBeepContextRef.current = new AudioContextClass();
      }

      const ctx = countdownBeepContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore beep failures in browsers that block autoplay without a user gesture.
    }
  }, []);

  useEffect(() => {
    if (mode !== 'countdown') return;
    if (countdown <= 0) {
      setMode('arming');
      return;
    }
    playCountdownBeep();
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, countdown, playCountdownBeep]);

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

        // Drive a lightweight visualizer from live mic input while recording.
        const audioContext = new window.AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.55;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        const source = audioContext.createMediaStreamSource(s);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const barCount = 18;
        const tick = () => {
          const a = analyserRef.current;
          if (!a) return;
          a.getByteFrequencyData(freqData);
          const nextBars = Array.from({ length: barCount }, (_, i) => {
            const idx = Math.floor((i / barCount) * freqData.length);
            const value = Math.min(1, (freqData[idx] / 255) * 2.8);
            return Math.max(0.04, value);
          });
          setAudioBars(nextBars);
          onAudioBars?.(nextBars);
          animationFrameRef.current = requestAnimationFrame(tick);
        };
        tick();

        recorder.start();
      })
      .catch((err) => {
        console.error('Microphone access denied:', err);
      });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      analyserRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioBars(Array(18).fill(0.04));
      onAudioBars?.(Array(18).fill(0.04));
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      if (countdownBeepContextRef.current) {
        countdownBeepContextRef.current.close();
        countdownBeepContextRef.current = null;
      }
    };
  }, []);

  const finishRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      onCompleteRef.current?.(null);
      return;
    }
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      onCompleteRef.current?.(blob);
    };
    recorder.stop();
  }, []);

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

  useEffect(() => {
    if (startRecordingSignal === lastStartSignalRef.current) return;
    lastStartSignalRef.current = startRecordingSignal;
    if (mode !== 'idle') return;
    setCountdown(COUNTDOWN_SECS);
    setMode('countdown');
  }, [startRecordingSignal]);

  useEffect(() => {
    if (stopRecordingSignal === lastStopSignalRef.current) return;
    lastStopSignalRef.current = stopRecordingSignal;
    if (mode !== 'recording') return;
    finishRecording();
  }, [stopRecordingSignal, mode, finishRecording]);

  const progress =
    mode === 'recording'
      ? ((RECORD_SECS - recordTime) / RECORD_SECS) * 100
      : 0;
  const progressFraction = progress / 100;

  const isRecording = mode === 'recording';
  const isArming = mode === 'arming';
  const showDescription = mode === 'idle';
  const buttonBase =
    'flex h-28 w-28 items-center justify-center rounded-full transition-[background-color,transform,box-shadow] duration-700 ease-out focus-visible:outline-none focus-visible:ring-4 active:scale-95';
  const buttonColor = isRecording
    ? 'bg-blue-600 hover:bg-blue-500 focus-visible:ring-blue-400'
    : 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-400';

  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

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

  // Split description: first line = intro sentence, rest = fragment bullets
  const [descIntro, ...descBulletLines] = concept.description.split('\n');
  const descBullets = descBulletLines.map((l) => l.replace(/^[-–•]\s*/, '').trim()).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--text-soft)]">
        Tell me about
      </p>

      <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
        ⭐ {concept.name}
      </h1>

      {/* Always reserve space so the button never jumps when description hides */}
      <div className="w-full max-w-2xl">
        <div
          className={`overflow-hidden rounded-2xl border border-gray-700 bg-[#232323] px-4 text-left text-sm leading-relaxed text-[var(--text-soft)] transition-[max-height,opacity,padding] duration-500 ease-in-out ${
            showDescription ? 'max-h-[32rem] py-3 opacity-100' : 'max-h-0 border-transparent py-0 opacity-0'
          }`}
        >
          {descIntro && <p className="mb-2 text-sm leading-snug">{descIntro}</p>}
          {descBullets.length > 0 && (
            <ul className="space-y-1 pl-1">
              {descBullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-[var(--accent)]">–</span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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

      {isRecording && isVoiceModeOn && (
        <p className="-mt-3 text-xs text-[var(--text-soft)]">Say &ldquo;Finish Test&rdquo; to stop</p>
      )}

      {isRecording && (
        <div className="flex h-10 w-full max-w-xs items-end justify-center gap-1">
          {audioBars.map((level, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-cyan-400/90 transition-[height] duration-75"
              style={{ height: `${6 + level * 28}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ConceptScreen;
