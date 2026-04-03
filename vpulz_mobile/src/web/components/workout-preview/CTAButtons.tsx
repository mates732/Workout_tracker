import React from 'react';

interface Props {
  onStart: () => void;
  onQuickStart?: () => void;
  startDisabled?: boolean;
}

export const CTAButtons: React.FC<Props> = ({ onStart, onQuickStart, startDisabled }) => {
  return (
    <div className="w-full flex gap-3 mt-4">
      <button
        onClick={onStart}
        disabled={startDisabled}
        className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg bg-[#22c55e] text-black font-semibold shadow-md hover:brightness-95 active:scale-95 transition-transform disabled:opacity-60"
        aria-label="Start workout"
      >
        Start Workout
      </button>

      <button
        onClick={onQuickStart}
        className="px-4 py-3 rounded-lg border border-white/10 text-white/90 bg-transparent hover:bg-white/2 active:scale-95 transition-transform"
        aria-label="Quick start"
      >
        Quick Start
      </button>
    </div>
  );
};

export default CTAButtons;
