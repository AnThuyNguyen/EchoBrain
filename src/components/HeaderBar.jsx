function HeaderBar({ large }) {
  return (
    <div className="relative z-10 flex min-h-[5rem] items-end gap-3 px-2 sm:min-h-[7rem]">
      <div
        className={`relative shrink-0 overflow-visible transition-[width,height] duration-500 ease-out motion-reduce:transition-none ${
          large
            ? 'h-[3.75rem] w-[20rem] sm:h-[5rem] sm:w-[30.5rem]'
            : 'h-[1.5rem] w-[7.6rem] sm:h-[2rem] sm:w-[18rem]'
        }`}
      >
        <h1
          className={`absolute left-0 top-0 origin-left font-bold leading-none tracking-tight text-6xl text-[var(--text-main)] transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none sm:text-8xl ${
            large ? 'scale-100' : 'scale-[0.60] sm:scale-[0.60]'
          }`}
        >
          EchoBrain
        </h1>
      </div>
      <span
        className={`whitespace-nowrap bg-[var(--bg)] font-semibold text-[var(--text-soft)] transition-all duration-500 ease-out motion-reduce:transition-none ${
          large
            ? 'text-lg opacity-100 sm:text-2xl'
            : 'translate-y-4 text-sm opacity-90 sm:translate-y-5 sm:text-base'
        }`}
      >
        You sure you understand it?
      </span>
    </div>
  );
}

export default HeaderBar;
