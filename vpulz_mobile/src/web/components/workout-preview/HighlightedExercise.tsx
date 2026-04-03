import React, { useMemo } from 'react';
import type { Exercise } from './types';

interface Props {
  exercise: Exercise;
  onFocus?: (id: string) => void;
}

export const HighlightedExercise: React.FC<Props> = ({ exercise, onFocus }) => {
  const topWeight = useMemo(() => Math.max(...exercise.sets.map((s) => s.weight ?? 0)), [exercise.sets]);
  const reps = exercise.sets[0]?.reps ?? '-';

  const prHint = exercise.previousBestKg ? (topWeight > (exercise.previousBestKg ?? 0) ? 'New PR possible' : Math.abs((exercise.previousBestKg ?? 0) - topWeight) <= (exercise.previousBestKg ?? 0) * 0.03 ? 'PR within reach' : null) : null;

  return (
    <div className="w-full p-4 rounded-[20px] bg-gradient-to-r from-[#071317] to-[#0b1722] shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-lg bg-gradient-to-tr from-[#22c55e]/20 to-transparent flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#0b1220] flex items-center justify-center text-sm font-semibold text-[#22c55e]">{exercise.name.split(' ').slice(0,1)[0]?.slice(0,1)}</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base">{exercise.name}</h3>
            {prHint ? (
              <div className="ml-2 px-2 py-1 rounded-full bg-[#0b1220] border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold shadow-sm animate-pulse">
                {prHint}
              </div>
            ) : null}
          </div>

          <p className="text-gray-400 text-sm mt-1">{`${exercise.sets.length} sets • ${reps} reps`}</p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-white font-extrabold text-lg">{topWeight ? `${topWeight}kg` : '—'}</div>
              <div className="text-gray-400 text-xs">top</div>
            </div>

            <button
              onClick={() => onFocus?.(exercise.id)}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111826] text-sm text-white/90 hover:bg-[#0f1724] active:scale-95 transition-transform"
            >
              Focus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightedExercise;
