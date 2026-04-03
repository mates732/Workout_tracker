import React from 'react';
import { SafeAreaView, View, StyleSheet, Alert } from 'react-native';
import WorkoutPreviewCard from './components/WorkoutPreviewCard';
import mockPlannedWorkout from './mockPreview';
import { useWorkoutFlow } from '../../shared/state/WorkoutFlowContext';
import { colors, spacing } from '../../shared/theme/tokens';

export function WorkoutPreviewDemoScreen() {
  const { startPlannedWorkout, startOrResumeWorkout } = useWorkoutFlow();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WorkoutPreviewCard
          plan={mockPlannedWorkout.preview}
          onStart={() => {
            try {
              startPlannedWorkout(mockPlannedWorkout);
            } catch {
              /* noop */
            }
          }}
          onQuickStart={() => {
            try {
              startOrResumeWorkout();
            } catch {
              /* noop */
            }
          }}
          onMove={() => Alert.alert('Move workout')}
          onDelete={() => Alert.alert('Delete workout')}
          onOpenExercise={(name) => Alert.alert(name)}
        />
      </View>
    </SafeAreaView>
  );
}

export default WorkoutPreviewDemoScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, alignItems: 'center', justifyContent: 'flex-start' },
});
