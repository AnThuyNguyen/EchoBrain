function HeaderBar({ large, showActions, canGoBack, onGoBack, onEndSession }) {
  return (
    <div className="sticky top-0 z-30 -mx-3 border-b border-gray-800/80 bg-[var(--bg)]/95 px-3 py-2 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-end sm:gap-x-3">
          <div
            className={`relative shrink-0 overflow-visible transition-none sm:transition-[width,height] sm:duration-500 sm:ease-out motion-reduce:transition-none ${
              large
                ? 'h-[2.8rem] w-[15rem] sm:h-[3.75rem] sm:w-[20rem]'
                : 'h-[2.8rem] w-[15rem] sm:h-[1.5rem] sm:w-[10rem]'
            }`}
          >
            <h1
              className={`absolute left-0 top-0 origin-left font-bold leading-none tracking-tight text-[var(--text-main)] transition-none will-change-transform sm:transition-transform sm:duration-500 sm:ease-out motion-reduce:transition-none ${
                large
                  ? 'scale-100 text-5xl sm:text-6xl'
                  : 'scale-100 text-5xl sm:scale-[0.60] sm:text-6xl'
              }`}
            >
              EchoBrain
            </h1>
          </div>
          <span
            className={`font-semibold text-[var(--text-soft)] transition-none sm:transition-all sm:duration-500 sm:ease-out motion-reduce:transition-none ${
              large
                ? 'text-base opacity-100 sm:text-xl'
                : 'text-base opacity-90 sm:translate-y-3 sm:text-base'
            }`}
          >
            You sure you understand it?
          </span>
        </div>

        {showActions && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onGoBack}
              disabled={!canGoBack}
              className="rounded-lg border border-[var(--accent)]/35 px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={onEndSession}
              className="rounded-lg bg-[var(--warn)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              End Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeaderBar;
