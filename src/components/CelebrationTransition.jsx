import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const burstColors = ['#22d3ee', '#38bdf8', '#818cf8', '#f472b6', '#f59e0b', '#34d399'];

function CelebrationTransition() {
  const confettiCanvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const canvas = confettiCanvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const launch = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const end = Date.now() + 1000;
    let frameId;

    const fireCannons = () => {
      if (Date.now() > end) {
        return;
      }

      launch({
        particleCount: 4,
        angle: 60,
        spread: 55,
        startVelocity: 58,
        origin: { x: 0, y: 0.98 },
        colors: burstColors,
        scalar: 0.9,
      });

      launch({
        particleCount: 4,
        angle: 120,
        spread: 55,
        startVelocity: 58,
        origin: { x: 1, y: 0.98 },
        colors: burstColors,
        scalar: 0.9,
      });

      frameId = requestAnimationFrame(fireCannons);
    };

    fireCannons();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="relative flex min-h-[28rem] h-full items-center justify-center rounded-2xl sm:min-h-[32rem]">
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none absolute inset-0 z-30 h-full w-full"
        aria-hidden="true"
      />

      <div className="celebrate-card relative z-20 text-center">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
          Nice
        </h2>
      </div>
    </div>
  );
}

export default CelebrationTransition;
