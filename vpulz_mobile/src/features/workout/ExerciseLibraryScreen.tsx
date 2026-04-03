import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddExerciseScreen } from './AddExerciseScreen';

// Thin wrapper screen so route name is canonical `ExerciseLibrary`.
export function ExerciseLibraryScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AddExerciseScreen />
    </SafeAreaView>
  );
}

export default ExerciseLibraryScreen;
