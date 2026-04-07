import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  type SetType,
  type WorkoutExercise,
  type WorkoutSet,
  useWorkoutLogger,
} from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, typography } from "../theme/workoutLoggerTheme";
import { formatDuration } from "../utils/workoutLoggerDate";

type WorkoutNavigation = NativeStackNavigationProp<RootStackParamList, "Workout">;

const SET_LABEL: Record<SetType, string> = {
  normal: "#",
  warmup: "W",
  dropset: "D",
  failure: "F",
};

function parseInput(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
}

type SetRowProps = {
  exercise: WorkoutExercise;
  setItem: WorkoutSet;
  index: number;
  onUpdateSet: (
    exerciseId: string,
    setId: string,
    field: "kg" | "reps",
    value: number
  ) => void;
  onToggleSet: (exerciseId: string, setId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onCycleSetType: (exerciseId: string, setId: string) => void;
};

function SetRow({
  exercise,
  setItem,
  index,
  onUpdateSet,
  onToggleSet,
  onRemoveSet,
  onCycleSetType,
}: SetRowProps): React.JSX.Element {
  const completedStyle = setItem.completed ? styles.setInputCompleted : undefined;

  return (
    <View style={[styles.setRow, setItem.completed && styles.setRowCompleted]}>
      <Pressable
        style={styles.setTypeButton}
        onPress={() => onCycleSetType(exercise.id, setItem.id)}
      >
        <Text style={styles.setTypeText}>{SET_LABEL[setItem.type] ?? String(index + 1)}</Text>
      </Pressable>

      <Text style={styles.previousText}>
        {setItem.previous ? `${setItem.previous.kg}x${setItem.previous.reps}` : "-"}
      </Text>

      <TextInput
        style={[styles.setInput, completedStyle]}
        defaultValue={String(setItem.kg)}
        keyboardType="decimal-pad"
        onEndEditing={(event) =>
          onUpdateSet(exercise.id, setItem.id, "kg", parseInput(event.nativeEvent.text))
        }
      />

      <TextInput
        style={[styles.setInput, completedStyle]}
        defaultValue={String(setItem.reps)}
        keyboardType="number-pad"
        onEndEditing={(event) =>
          onUpdateSet(exercise.id, setItem.id, "reps", parseInput(event.nativeEvent.text))
        }
      />

      <Pressable
        style={[styles.doneButton, setItem.completed && styles.doneButtonActive]}
        onPress={() => onToggleSet(exercise.id, setItem.id)}
      >
        <Text style={[styles.doneButtonText, setItem.completed && styles.doneButtonTextActive]}>
          {setItem.completed ? "OK" : "--"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onRemoveSet(exercise.id, setItem.id)}
      >
        <Text style={styles.deleteButtonText}>Del</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutSessionScreen(): React.JSX.Element {
  const navigation = useNavigation<WorkoutNavigation>();
  const {
    workout,
    timerElapsedSec,
    timerRunning,
    startTimer,
    stopTimer,
    setWorkoutScreenActive,
    finishWorkout,
    discardWorkout,
    updateExerciseNotes,
    removeExercise,
    updateSetValue,
    toggleSetCompleted,
    removeSet,
    addSetRow,
    cycleSetType,
  } = useWorkoutLogger();

  useFocusEffect(
    useCallback(() => {
      setWorkoutScreenActive(true);
      return () => {
        setWorkoutScreenActive(false);
      };
    }, [setWorkoutScreenActive])
  );

  const openExerciseLibrary = (): void => {
    navigation.navigate("ExerciseLibrary");
  };

  const closeToHome = (): void => {
    navigation.navigate("Home");
  };

  const onFinish = (): void => {
    Alert.alert("Finish workout?", "This will save and end the session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: () => {
          finishWorkout();
          navigation.navigate("Home");
        },
      },
    ]);
  };

  const onDiscard = (): void => {
    Alert.alert("Discard workout?", "All progress in this session will be lost.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          discardWorkout();
          navigation.navigate("Home");
        },
      },
    ]);
  };

  if (!workout) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active workout</Text>
          <Text style={styles.emptyBody}>Start a workout from Home first.</Text>
          <Pressable style={styles.primaryButton} onPress={closeToHome}>
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topRow}>
        <Pressable style={styles.secondaryButton} onPress={closeToHome}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={openExerciseLibrary}>
          <Text style={styles.primaryButtonText}>Exercise Library</Text>
        </Pressable>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Workout Timer</Text>
        <Text style={styles.timerValue}>{formatDuration(timerElapsedSec)}</Text>
        <Pressable
          style={[styles.timerToggle, timerRunning ? styles.stopButton : styles.startButton]}
          onPress={timerRunning ? stopTimer : startTimer}
        >
          <Text style={styles.timerToggleText}>{timerRunning ? "Stop" : "Start"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {workout.exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseCopy}>
                <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
              </View>
              <Pressable
                style={styles.removeExerciseButton}
                onPress={() => removeExercise(exercise.id)}
              >
                <Text style={styles.removeExerciseText}>Remove</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.notesInput}
              value={exercise.notes}
              onChangeText={(value) => updateExerciseNotes(exercise.id, value)}
              placeholder="Add notes for this exercise"
              placeholderTextColor={palette.textDim}
            />

            <View style={styles.setHeaderRow}>
              <Text style={styles.setHeaderCell}>SET</Text>
              <Text style={styles.setHeaderCell}>PREV</Text>
              <Text style={styles.setHeaderCell}>KG</Text>
              <Text style={styles.setHeaderCell}>REPS</Text>
              <Text style={styles.setHeaderCell}>DONE</Text>
              <Text style={styles.setHeaderCell}>DEL</Text>
            </View>

            {exercise.sets.map((setItem, index) => (
              <SetRow
                key={setItem.id}
                exercise={exercise}
                setItem={setItem}
                index={index}
                onUpdateSet={updateSetValue}
                onToggleSet={toggleSetCompleted}
                onRemoveSet={removeSet}
                onCycleSetType={cycleSetType}
              />
            ))}

            <Pressable style={styles.addSetButton} onPress={() => addSetRow(exercise.id)}>
              <Text style={styles.addSetText}>+ Add set</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.footerActions}>
          <Pressable style={styles.primaryButton} onPress={openExerciseLibrary}>
            <Text style={styles.primaryButtonText}>Workout to Exercise Library</Text>
          </Pressable>
          <Pressable style={styles.finishButton} onPress={onFinish}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={onDiscard}>
            <Text style={styles.discardButtonText}>Discard Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bgDeep,
  },
  topRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  timerCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  timerLabel: {
    color: palette.textDim,
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  timerValue: {
    color: palette.text,
    fontSize: 50,
    fontWeight: "900",
    textAlign: "center",
  },
  timerToggle: {
    minHeight: 44,
    minWidth: 120,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  startButton: {
    backgroundColor: palette.accentBg,
    borderColor: "rgba(249,246,238,0.36)",
  },
  stopButton: {
    backgroundColor: "rgba(224,90,58,0.18)",
    borderColor: "rgba(224,90,58,0.50)",
  },
  timerToggleText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  exerciseCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  exerciseCopy: {
    flex: 1,
  },
  exerciseTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  exerciseMuscle: {
    color: palette.textMuted,
    fontSize: typography.caption,
    marginTop: 2,
  },
  removeExerciseButton: {
    minHeight: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(224,90,58,0.50)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  removeExerciseText: {
    color: palette.danger,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  notesInput: {
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(0,0,0,0.20)",
    color: palette.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.sm,
  },
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  setHeaderCell: {
    flex: 1,
    textAlign: "center",
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    gap: 3,
  },
  setRowCompleted: {
    backgroundColor: palette.successBg,
  },
  setTypeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  setTypeText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  previousText: {
    flex: 1,
    color: palette.textDim,
    textAlign: "center",
    fontSize: typography.caption,
  },
  setInput: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    color: palette.text,
    textAlign: "center",
    fontSize: typography.body,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  setInputCompleted: {
    borderColor: palette.success,
    color: palette.success,
  },
  doneButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  doneButtonActive: {
    backgroundColor: palette.success,
    borderColor: "transparent",
  },
  doneButtonText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  doneButtonTextActive: {
    color: palette.bgDeep,
  },
  deleteButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(224,90,58,0.50)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: palette.danger,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  addSetButton: {
    minHeight: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  footerActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(249,246,238,0.34)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  finishButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(175,225,175,0.62)",
    backgroundColor: "rgba(175,225,175,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  finishButtonText: {
    color: palette.success,
    fontSize: typography.body,
    fontWeight: "800",
  },
  discardButton: {
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(224,90,58,0.50)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  discardButtonText: {
    color: palette.danger,
    fontSize: typography.body,
    fontWeight: "700",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: typography.body,
    textAlign: "center",
  },
});
