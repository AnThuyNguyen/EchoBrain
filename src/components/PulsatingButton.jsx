import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';

const PulsatingButton = forwardRef(function PulsatingButton(
  {
    className = '',
    children,
    pulseColor,
    duration = '1.5s',
    distance = '8px',
    variant = 'pulse',
    style,
    ...props
  },
  ref
) {
  const innerRef = useRef(null);

  useImperativeHandle(ref, () => innerRef.current);

  useLayoutEffect(() => {
    const button = innerRef.current;
    if (!button) {
      return undefined;
    }

    if (pulseColor) {
      button.style.removeProperty('--bg');
      return undefined;
    }

    let animationFrameId = 0;
    let currentBg = '';

    const updateBg = () => {
      animationFrameId = 0;
      const nextBg = getComputedStyle(button).backgroundColor;
      if (nextBg === currentBg) {
        return;
      }

      currentBg = nextBg;
      button.style.setProperty('--bg', nextBg);
    };

    const scheduleBgUpdate = () => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(updateBg);
    };

    updateBg();

    const themeObserver = new MutationObserver(scheduleBgUpdate);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const buttonObserver = new MutationObserver(scheduleBgUpdate);
    buttonObserver.observe(button, {
      attributes: true,
    });

    const syncEvents = ['blur', 'focus', 'pointerenter', 'pointerleave'];
    syncEvents.forEach((eventName) => {
      button.addEventListener(eventName, scheduleBgUpdate);
    });

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      themeObserver.disconnect();
      buttonObserver.disconnect();
      syncEvents.forEach((eventName) => {
        button.removeEventListener(eventName, scheduleBgUpdate);
      });
    };
  }, [pulseColor]);

  return (
    <button
      ref={innerRef}
      className={`relative flex cursor-pointer items-center justify-center text-center ${className}`}
      style={{
        ...(pulseColor ? { '--pulse-color': pulseColor } : {}),
        '--duration': duration,
        '--distance': distance,
        ...style,
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-inherit ${
          variant === 'pulse' ? 'animate-magic-pulse' : 'animate-magic-pulse-ripple'
        }`}
      />
    </button>
  );
});

export default PulsatingButton;