import React, { useMemo } from 'react';
import type { Workout } from './types';
import { ExerciseItem } from './ExerciseItem';
import { HighlightedExercise } from './HighlightedExercise';
import { CTAButtons } from './CTAButtons';

interface Props {
  workout: Workout;
  onStart: (workoutId: string) => void;
  onQuickStart?: (workoutId: string) => void;
  onOpenExercise?: (exerciseId: string) => void;
}

function hasPROpportunity(ex: Workout['exercises'][number]) {
  if (!ex.previousBestKg) return false;
  const top = Math.max(...ex.sets.map((s) => s.weight ?? 0));
  if (!top) return false;
  // PR if top exceeds previous best, or within 3% => "within reach"
  return top >= ex.previousBestKg * 0.97;
}

export const WorkoutPreviewCard: React.FC<Props> = ({ workout, onStart, onQuickStart, onOpenExercise }) => {
  const prCandidates = useMemo(() => workout.exercises.filter((e) => hasPROpportunity(e)), [workout.exercises]);

  const highlighted = useMemo(() => workout.exercises.find((e) => e.isHighlighted) ?? workout.exercises[0], [workout.exercises]);

  const microcopy = useMemo(() => {
    if (prCandidates.length > 0) return `PR within reach — try ${prCandidates[0].name}`;
    if ((workout.previousPerformance?.streak ?? 0) > 0) return `Keep the streak alive — ${workout.previousPerformance?.streak} days`; 
    return 'Short and focused — smash today’s session.';
  }, [prCandidates, workout.previousPerformance]);

  return (
    <article className="w-full max-w-md mx-auto p-4 rounded-[20px] bg-[#071018] shadow-lg">
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-white text-lg font-bold">{workout.title}</h2>
          <div className="mt-1 text-gray-400 text-xs">{workout.durationMin ? `${workout.durationMin} min • ${workout.splitType ?? ''}` : 'Planned session'}</div>
          <div className="mt-2 text-[#9CA3AF] text-sm">{microcopy}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {workout.previousPerformance?.streak ? (
            <div className="px-2 py-1 rounded-full bg-[#0b1220] text-xs text-[#22c55e] font-semibold">{workout.previousPerformance.streak} day streak</div>
          ) : null}

          {prCandidates.length > 0 ? (
            <div className="px-2 py-1 rounded-full bg-[#0b1220] text-xs text-[#a3f7b2] font-semibold">{prCandidates.length} PR candidate</div>
          ) : null}
        </div>
      </header>

      <div className="mt-4 space-y-3">
        {highlighted ? (
          <HighlightedExercise exercise={highlighted} onFocus={(id) => onOpenExercise?.(id)} />
        ) : null}

        <div className="grid gap-2">
          {workout.exercises.map((ex) => (
            <ExerciseItem key={ex.id} exercise={ex} onSelect={(id) => onOpenExercise?.(id)} />
          ))}
        </div>
      </div>

      <CTAButtons
        onStart={() => onStart(workout.id)}
        onQuickStart={() => onQuickStart?.(workout.id)}
      />
    </article>
  );
};

export default WorkoutPreviewCard;
