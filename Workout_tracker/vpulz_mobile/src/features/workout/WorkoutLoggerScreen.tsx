// Premium Workout Logger Screen (Hevy/Strong-level UX)
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import WorkoutTopBar from './components/WorkoutTopBar';
import MinimizedWorkoutBar from './components/MinimizedWorkoutBar';
import WorkoutTimer from './components/WorkoutTimer';
import ExerciseLibraryModal from './components/ExerciseLibraryModal';
import ExerciseDetailModal from './components/ExerciseDetailModal';
import ExerciseCard from './components/ExerciseCard';
import AddSetButton from './components/AddSetButton';
import { useWorkoutContext } from './state/workoutContext';
import type { SettingsStackParamList } from '../settings/SettingsNavigator';

export default function WorkoutLoggerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();
  const {
    minimized,
    exercises,
    showLibrary,
    showDetail,
    selectedExercise,
    timer,
    restoreFullScreen,
    openExerciseLibrary,
    closeExerciseLibrary,
    addSetToExercise,
    closeExerciseDetail,
  } = useWorkoutContext();

  return (
    <SafeAreaView style={styles.safeArea}>
      <WorkoutTopBar />
      {minimized ? (
        <MinimizedWorkoutBar onPress={restoreFullScreen} />
      ) : (
        <View style={styles.container}>
          <WorkoutTimer timer={timer} />
          {exercises.length === 0 ? (
            <ExerciseLibraryModal
              visible={showLibrary}
              onClose={closeExerciseLibrary}
              onOpenAddExercise={() => navigation.navigate('AddExercise', { autoOpenLogger: false })}
            />
          ) : (
            exercises.map((ex) => <ExerciseCard key={ex.id} exercise={ex} />)
          )}
          <AddSetButton
            onPress={() => {
              if (exercises.length === 0) {
                openExerciseLibrary();
                return;
              }
              addSetToExercise();
            }}
          />
          <ExerciseDetailModal visible={showDetail} exercise={selectedExercise} onClose={closeExerciseDetail} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, padding: 0 },
});
