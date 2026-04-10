import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo } from "react";
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

const SET_LABEL_COLOR: Record<SetType, string> = {
  normal: palette.textDim,
  warmup: "#4A90F0",
  dropset: "#FBBC04",
  failure: palette.danger,
};

function parseInput(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

type SetRowProps = {
  exercise: WorkoutExercise;
  setItem: WorkoutSet;
  index: number;
  onUpdateSet: (exerciseId: string, setId: string, field: "kg" | "reps", value: number) => void;
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
  const labelColor = SET_LABEL_COLOR[setItem.type];
  const isNormal = setItem.type === "normal";

  return (
    <View style={[styles.setRow, setItem.completed && styles.setRowCompleted]}>
      <Pressable
        style={[styles.setTypeButton, !isNormal && { borderColor: `${labelColor}60` }]}
        onPress={() => onCycleSetType(exercise.id, setItem.id)}
      >
        <Text style={[styles.setTypeText, { color: isNormal ? palette.textDim : labelColor }]}>
          {isNormal ? String(index + 1) : SET_LABEL[setItem.type]}
        </Text>
      </Pressable>

      <Text style={styles.previousText}>
        {setItem.previous ? `${setItem.previous.kg}×${setItem.previous.reps}` : "—"}
      </Text>

      <TextInput
        style={[styles.setInput, setItem.completed && styles.setInputCompleted]}
        defaultValue={setItem.kg > 0 ? String(setItem.kg) : ""}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={palette.textDim}
        onEndEditing={(e) => onUpdateSet(exercise.id, setItem.id, "kg", parseInput(e.nativeEvent.text))}
        returnKeyType="next"
      />

      <TextInput
        style={[styles.setInput, setItem.completed && styles.setInputCompleted]}
        defaultValue={setItem.reps > 0 ? String(setItem.reps) : ""}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={palette.textDim}
        onEndEditing={(e) => onUpdateSet(exercise.id, setItem.id, "reps", parseInput(e.nativeEvent.text))}
        returnKeyType="done"
      />

      <Pressable
        style={[styles.doneButton, setItem.completed && styles.doneButtonActive]}
        onPress={() => onToggleSet(exercise.id, setItem.id)}
      >
        <Text style={[styles.doneButtonText, setItem.completed && styles.doneButtonTextActive]}>
          {setItem.completed ? "✓" : "○"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={() => onRemoveSet(exercise.id, setItem.id)}
      >
        <Text style={styles.deleteButtonText}>✕</Text>
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
      return () => setWorkoutScreenActive(false);
    }, [setWorkoutScreenActive])
  );

  // Live volume: sum of completed sets
  const liveVolume = useMemo(() => {
    if (!workout) return 0;
    let vol = 0;
    for (const ex of workout.exercises) {
      for (const s of ex.sets) {
        if (s.completed) vol += s.kg * s.reps;
      }
    }
    return Math.round(vol);
  }, [workout]);

  const completedSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.completed).length, 0);
  }, [workout]);

  const totalSets = useMemo(() => {
    if (!workout) return 0;
    return workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }, [workout]);

  const openExerciseLibrary = (): void => navigation.navigate("ExerciseLibrary");
  const closeToHome = (): void => navigation.navigate("Home");

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
          <Pressable style={styles.secondaryButton} onPress={closeToHome}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top bar */}
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={closeToHome}>
          <Text style={styles.backButtonText}>‹ Home</Text>
        </Pressable>
        <Text style={styles.workoutTitle} numberOfLines={1}>{workout.title}</Text>
        <Pressable style={styles.addExButton} onPress={openExerciseLibrary}>
          <Text style={styles.addExButtonText}>+ Exercise</Text>
        </Pressable>
      </View>

      {/* Timer card */}
      <View style={styles.timerCard}>
        <View style={styles.timerMain}>
          <View style={styles.timerBlock}>
            <Text style={styles.timerLabel}>TIME</Text>
            <Text style={styles.timerValue}>{formatDuration(timerElapsedSec)}</Text>
          </View>
          <View style={styles.timerDivider} />
          <View style={styles.timerBlock}>
            <Text style={styles.timerLabel}>VOLUME</Text>
            <Text style={styles.timerValue}>{liveVolume > 0 ? `${liveVolume}kg` : "—"}</Text>
          </View>
          <View style={styles.timerDivider} />
          <View style={styles.timerBlock}>
            <Text style={styles.timerLabel}>SETS</Text>
            <Text style={styles.timerValue}>{completedSets}/{totalSets}</Text>
          </View>
        </View>
        <Pressable
          style={[styles.timerToggle, timerRunning ? styles.stopButton : styles.startButton]}
          onPress={timerRunning ? stopTimer : startTimer}
        >
          <Text style={[styles.timerToggleText, timerRunning ? styles.stopText : styles.startText]}>
            {timerRunning ? "⏸ Pause" : "▶ Resume"}
          </Text>
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
              placeholder="Add notes…"
              placeholderTextColor={palette.textDim}
            />

            <View style={styles.setHeaderRow}>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>SET</Text>
              <Text style={[styles.setHeaderCell, { flex: 1.4 }]}>PREV</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>KG</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>DONE</Text>
              <Text style={[styles.setHeaderCell, { flex: 0.7 }]}></Text>
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
              <Text style={styles.addSetText}>+ Add Set</Text>
            </Pressable>
          </View>
        ))}

        {workout.exercises.length === 0 && (
          <View style={styles.noExercisesState}>
            <Text style={styles.noExercisesTitle}>No exercises yet</Text>
            <Text style={styles.noExercisesBody}>Add exercises from the library above.</Text>
          </View>
        )}

        <View style={styles.footerActions}>
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
  // ── Top bar ───────────────────────────────────────────────────────────────────
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
  },
  backButtonText: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: "700",
  },
  workoutTitle: {
    flex: 1,
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },
  addExButton: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  addExButtonText: {
    color: palette.accentLight,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  // ── Timer card ────────────────────────────────────────────────────────────────
  timerCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    gap: spacing.sm,
  },
  timerMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  timerBlock: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  timerDivider: {
    width: 1,
    height: 36,
    backgroundColor: palette.cardBorder,
  },
  timerLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  timerValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  timerToggle: {
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: palette.accentBg,
    borderColor: palette.accentBorder,
  },
  stopButton: {
    backgroundColor: "rgba(124,106,245,0.08)",
    borderColor: "rgba(124,106,245,0.30)",
  },
  timerToggleText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  startText: { color: palette.accentLight },
  stopText: { color: palette.textMuted },
  // ── Content ───────────────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  // ── Exercise card ─────────────────────────────────────────────────────────────
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
  exerciseCopy: { flex: 1 },
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
    minHeight: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
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
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: palette.text,
    fontSize: typography.caption,
    paddingHorizontal: spacing.sm,
  },
  // ── Set table ─────────────────────────────────────────────────────────────────
  setHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  setHeaderCell: {
    textAlign: "center",
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.sm,
    paddingVertical: 3,
    gap: 3,
  },
  setRowCompleted: {
    backgroundColor: "rgba(74,222,128,0.07)",
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
    fontSize: typography.caption,
    fontWeight: "900",
  },
  previousText: {
    flex: 1.4,
    color: palette.textDim,
    textAlign: "center",
    fontSize: typography.tiny,
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
    backgroundColor: "rgba(0,0,0,0.25)",
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
    color: palette.textDim,
    fontSize: 16,
    fontWeight: "900",
  },
  doneButtonTextActive: {
    color: "#0B0B0F",
  },
  deleteButton: {
    flex: 0.7,
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: palette.danger,
    fontSize: 11,
    fontWeight: "700",
  },
  addSetButton: {
    minHeight: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addSetText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  // ── Empty state ───────────────────────────────────────────────────────────────
  noExercisesState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
    gap: spacing.xs,
  },
  noExercisesTitle: {
    color: palette.textMuted,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  noExercisesBody: {
    color: palette.textDim,
    fontSize: typography.body,
    textAlign: "center",
  },
  // ── Footer actions ────────────────────────────────────────────────────────────
  footerActions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: palette.accentLight,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 50,
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
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.45)",
    backgroundColor: "rgba(74,222,128,0.12)",
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
    borderColor: palette.dangerBorder,
    backgroundColor: palette.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  discardButtonText: {
    color: palette.danger,
    fontSize: typography.body,
    fontWeight: "700",
  },
  // ── Empty workout state ───────────────────────────────────────────────────────
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
