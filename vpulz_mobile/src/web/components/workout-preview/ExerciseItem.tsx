import React, { memo, useMemo } from 'react';
import type { Exercise } from './types';

interface Props {
  exercise: Exercise;
  showPrevious?: boolean;
  onSelect?: (id: string) => void;
}

export const ExerciseItem: React.FC<Props> = memo(function ExerciseItem({ exercise, showPrevious = true, onSelect }) {
  const setsSummary = useMemo(() => {
    const sets = exercise.sets.length;
    const reps = exercise.sets[0]?.reps ?? '-';
    const topWeight = Math.max(...exercise.sets.map((s) => s.weight ?? 0));
    return `${sets}×${reps}${topWeight ? ` • ${topWeight}kg` : ''}`;
  }, [exercise.sets]);

  const previous = exercise.previousBestKg ? `${exercise.previousBestKg}kg` : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(exercise.id)}
      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#0b1220] hover:bg-[#0f1724] active:scale-[0.985] transition-transform shadow-sm"
      aria-label={`Open ${exercise.name}`}
    >
      <div className="flex flex-col text-left">
        <span className="text-white font-semibold text-sm">{exercise.name}</span>
        <span className="text-gray-400 text-xs mt-1">{setsSummary}</span>
      </div>

      <div className="flex items-center gap-3">
        {showPrevious && previous ? (
          <div className="flex flex-col items-end">
            <span className="text-gray-300 text-xs">Last</span>
            <span className="text-gray-200 text-sm font-medium">{previous}</span>
          </div>
        ) : null}

        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
});

export default ExerciseItem;
