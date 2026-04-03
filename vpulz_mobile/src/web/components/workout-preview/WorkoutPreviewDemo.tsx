import React from 'react';
import { WorkoutPreviewCard } from './WorkoutPreviewCard';
import { mockWorkout } from './mockData';

export const WorkoutPreviewDemo: React.FC = () => {
  const handleStart = (id: string) => {
    // production-ready: hook into navigation + analytics
    console.log('Start workout', id);
  };

  const handleQuickStart = (id: string) => {
    console.log('Quick start', id);
  };

  const handleOpenExercise = (exerciseId: string) => {
    console.log('Open exercise', exerciseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05060a] to-[#071018] p-4 flex items-start justify-center">
      <div className="w-full max-w-md">
        <WorkoutPreviewCard
          workout={mockWorkout}
          onStart={handleStart}
          onQuickStart={handleQuickStart}
          onOpenExercise={handleOpenExercise}
        />
      </div>
    </div>
  );
};

export default WorkoutPreviewDemo;
