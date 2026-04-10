import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  useWorkoutStore,
  getElapsedSeconds,
  formatDuration,
  mapExerciseToStore,
} from '../../store/workoutStore';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ActiveWorkout'>;

const EXERCISES_LIBRARY = [
  { name: 'Barbell Back Squat', muscles: ['Quads', 'Glutes'], equipment: ['Barbell'] },
  { name: 'Bench Press', muscles: ['Chest', 'Triceps'], equipment: ['Barbell'] },
  { name: 'Deadlift', muscles: ['Back', 'Hamstrings'], equipment: ['Barbell'] },
  { name: 'Overhead Press', muscles: ['Shoulders', 'Triceps'], equipment: ['Barbell'] },
  { name: 'Barbell Row', muscles: ['Back', 'Biceps'], equipment: ['Barbell'] },
  { name: 'Pull-Up', muscles: ['Back', 'Biceps'], equipment: ['Bodyweight'] },
  { name: 'Dumbbell Curl', muscles: ['Biceps'], equipment: ['Dumbbell'] },
  { name: 'Tricep Pushdown', muscles: ['Triceps'], equipment: ['Cable'] },
  { name: 'Lateral Raise', muscles: ['Shoulders'], equipment: ['Dumbbell'] },
  { name: 'Leg Press', muscles: ['Quads', 'Glutes'], equipment: ['Machine'] },
  { name: 'Romanian Deadlift', muscles: ['Hamstrings', 'Glutes'], equipment: ['Barbell'] },
  { name: 'Incline Bench Press', muscles: ['Upper Chest', 'Triceps'], equipment: ['Barbell'] },
  { name: 'Lat Pulldown', muscles: ['Back', 'Biceps'], equipment: ['Cable'] },
  { name: 'Cable Row', muscles: ['Back'], equipment: ['Cable'] },
  { name: 'Bulgarian Split Squat', muscles: ['Quads', 'Glutes'], equipment: ['Dumbbell'] },
  { name: 'Hip Thrust', muscles: ['Glutes'], equipment: ['Barbell'] },
  { name: 'Face Pull', muscles: ['Rear Delts'], equipment: ['Cable'] },
  { name: 'Dumbbell Bench Press', muscles: ['Chest', 'Triceps'], equipment: ['Dumbbell'] },
  { name: 'Hammer Curl', muscles: ['Biceps'], equipment: ['Dumbbell'] },
  { name: 'Calf Raise', muscles: ['Calves'], equipment: ['Machine'] },
  { name: 'Plank', muscles: ['Core'], equipment: ['Bodyweight'] },
  { name: 'Leg Curl', muscles: ['Hamstrings'], equipment: ['Machine'] },
  { name: 'Chest Fly', muscles: ['Chest'], equipment: ['Cable'] },
  { name: 'Skull Crusher', muscles: ['Triceps'], equipment: ['Barbell'] },
];

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const activeWorkoutId = useWorkoutStore((s) => s.activeWorkoutId);
  const sessionStartedAt = useWorkoutStore((s) => s.sessionStartedAt);
  const workouts = useWorkoutStore((s) => s.workouts);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addSet = useWorkoutStore((s) => s.addSet);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const createWorkout = useWorkoutStore((s) => s.createWorkout);
  const updateWorkoutName = useWorkoutStore((s) => s.updateWorkoutName);

  const [elapsed, setElapsed] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Start workout if navigated with workoutId but no active session
  useEffect(() => {
    if (activeWorkoutId) return;
    const wid = route.params?.workoutId;
    if (wid) {
      startWorkout(wid);
    } else {
      const id = createWorkout('Workout');
      startWorkout(id);
    }
  }, []);

  // Timer
  useEffect(() => {
    if (!sessionStartedAt) return;
    setElapsed(getElapsedSeconds(sessionStartedAt));
    const interval = setInterval(() => {
      setElapsed(getElapsedSeconds(sessionStartedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  const workout = useMemo(
    () => workouts.find((w) => w.id === activeWorkoutId) ?? null,
    [workouts, activeWorkoutId],
  );

  useEffect(() => {
    if (workout && !workoutName) {
      setWorkoutName(workout.name);
    }
  }, [workout?.id]);

  const exercises = workout?.exercises ?? [];

  const completedSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.completed).length, 0),
    [exercises],
  );

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return EXERCISES_LIBRARY;
    return EXERCISES_LIBRARY.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscles.some((m) => m.toLowerCase().includes(q)),
    );
  }, [exerciseSearch]);

  const handleAddExercise = useCallback(
    (exercise: (typeof EXERCISES_LIBRARY)[0]) => {
      if (!activeWorkoutId) return;
      addExercise({
        workoutId: activeWorkoutId,
        name: exercise.name,
        muscles: exercise.muscles,
        equipment: exercise.equipment,
      });
      setShowExercisePicker(false);
      setExerciseSearch('');
    },
    [activeWorkoutId, addExercise],
  );

  const handleFinish = useCallback(() => {
    const entry = finishWorkout();
    setShowFinishConfirm(false);
    if (entry) {
      navigation.replace('WorkoutSummary', { entry });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [finishWorkout, navigation]);

  const handleDiscard = useCallback(() => {
    finishWorkout();
    setShowDiscardConfirm(false);
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }, [finishWorkout, navigation]);

  const handleSaveName = useCallback(() => {
    if (activeWorkoutId && workoutName.trim()) {
      updateWorkoutName(activeWorkoutId, workoutName.trim());
    }
    setIsEditingName(false);
  }, [activeWorkoutId, updateWorkoutName, workoutName]);

  if (!workout) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Starting workout...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.topBarBtn}
          onPress={() => {
            if (exercises.length === 0) {
              handleDiscard();
            } else {
              setShowDiscardConfirm(true);
            }
          }}
        >
          <Text style={styles.topBarBtnText}>Cancel</Text>
        </Pressable>

        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
        </View>

        <Pressable
          style={[styles.topBarBtn, styles.finishBtn]}
          onPress={() => setShowFinishConfirm(true)}
        >
          <Text style={styles.finishBtnText}>Finish</Text>
        </Pressable>
      </View>

      {/* Workout name */}
      <View style={styles.nameRow}>
        {isEditingName ? (
          <TextInput
            style={styles.nameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            onBlur={handleSaveName}
            onSubmitEditing={handleSaveName}
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
          />
        ) : (
          <Pressable onPress={() => setIsEditingName(true)}>
            <Text style={styles.workoutName}>{workout.name}</Text>
          </Pressable>
        )}
        <Text style={styles.setCounter}>
          {completedSets}/{totalSets} sets
        </Text>
      </View>

      {/* Exercises */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptySubtitle}>Tap below to add your first exercise</Text>
          </View>
        ) : (
          exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              {/* Exercise header */}
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseAvatar}>
                  <Text style={styles.exerciseAvatarText}>
                    {exercise.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Pressable
                  style={styles.removeExerciseBtn}
                  onPress={() => removeExercise(workout.id, exercise.id)}
                >
                  <Text style={styles.removeExerciseText}>×</Text>
                </Pressable>
              </View>

              {/* Set header labels */}
              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderLabel, { width: 36 }]}>SET</Text>
                <Text style={[styles.setHeaderLabel, { flex: 1 }]}>KG</Text>
                <Text style={[styles.setHeaderLabel, { flex: 1 }]}>REPS</Text>
                <Text style={[styles.setHeaderLabel, { width: 44 }]}></Text>
              </View>

              {/* Sets */}
              {exercise.sets.map((set, setIndex) => (
                <View
                  key={set.id}
                  style={[styles.setRow, set.completed && styles.setRowCompleted]}
                >
                  <Text
                    style={[
                      styles.setNumber,
                      set.completed && styles.setTextCompleted,
                    ]}
                  >
                    {setIndex + 1}
                  </Text>
                  <TextInput
                    style={[styles.setInput, set.completed && styles.setInputCompleted]}
                    value={String(set.weight)}
                    onChangeText={(text) => {
                      const val = parseFloat(text) || 0;
                      updateSet(workout.id, exercise.id, set.id, { weight: val });
                    }}
                    keyboardType="decimal-pad"
                    editable={!set.completed}
                    selectTextOnFocus
                  />
                  <TextInput
                    style={[styles.setInput, set.completed && styles.setInputCompleted]}
                    value={String(set.reps)}
                    onChangeText={(text) => {
                      const val = parseInt(text, 10) || 0;
                      updateSet(workout.id, exercise.id, set.id, { reps: val });
                    }}
                    keyboardType="number-pad"
                    editable={!set.completed}
                    selectTextOnFocus
                  />
                  <Pressable
                    style={[styles.checkBtn, set.completed && styles.checkBtnCompleted]}
                    onPress={() =>
                      updateSet(workout.id, exercise.id, set.id, {
                        completed: !set.completed,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.checkText,
                        set.completed && styles.checkTextCompleted,
                      ]}
                    >
                      ✓
                    </Text>
                  </Pressable>
                </View>
              ))}

              {/* Add set + remove set */}
              <View style={styles.setActions}>
                <Pressable
                  style={styles.addSetBtn}
                  onPress={() => addSet(workout.id, exercise.id)}
                >
                  <Text style={styles.addSetText}>+ Add Set</Text>
                </Pressable>
                {exercise.sets.length > 1 && (
                  <Pressable
                    style={styles.removeSetBtn}
                    onPress={() =>
                      removeSet(
                        workout.id,
                        exercise.id,
                        exercise.sets[exercise.sets.length - 1].id,
                      )
                    }
                  >
                    <Text style={styles.removeSetText}>- Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}

        {/* Add Exercise button */}
        <Pressable
          style={({ pressed }) => [
            styles.addExerciseBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => setShowExercisePicker(true)}
        >
          <Text style={styles.addExerciseIcon}>+</Text>
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowExercisePicker(false)} />
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Exercise</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={colors.mutedText}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
              autoFocus
            />
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.name}
              style={styles.exerciseList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.exercisePickerRow,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleAddExercise(item)}
                >
                  <View style={styles.exercisePickerAvatar}>
                    <Text style={styles.exercisePickerAvatarText}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.exercisePickerInfo}>
                    <Text style={styles.exercisePickerName}>{item.name}</Text>
                    <Text style={styles.exercisePickerMuscle}>
                      {item.muscles.join(', ')}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Finish Confirmation Modal */}
      <Modal visible={showFinishConfirm} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Finish Workout?</Text>
            <Text style={styles.dialogBody}>
              Duration: {formatDuration(elapsed)}
              {'\n'}
              {completedSets} of {totalSets} sets completed
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogCancelBtn]}
                onPress={() => setShowFinishConfirm(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogConfirmBtn]}
                onPress={handleFinish}
              >
                <Text style={styles.dialogConfirmText}>Finish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Discard Confirmation Modal */}
      <Modal visible={showDiscardConfirm} transparent animationType="fade">
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Discard Workout?</Text>
            <Text style={styles.dialogBody}>
              Your current workout will not be saved.
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogCancelBtn]}
                onPress={() => setShowDiscardConfirm(false)}
              >
                <Text style={styles.dialogCancelText}>Keep Going</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogDangerBtn]}
                onPress={handleDiscard}
              >
                <Text style={styles.dialogDangerText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: 100,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  topBarBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  topBarBtnText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  timerContainer: {
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  finishBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: typography.caption,
    fontWeight: '800',
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  workoutName: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  nameInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 2,
  },
  setCounter: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },

  // Exercise card
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  removeExerciseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeExerciseText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Set header
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  setHeaderLabel: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Set row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  setRowCompleted: {
    backgroundColor: colors.success + '18',
    borderColor: colors.success + '33',
  },
  setNumber: {
    width: 28,
    textAlign: 'center',
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  setTextCompleted: {
    color: colors.success,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 38,
  },
  setInputCompleted: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '22',
    color: colors.success,
  },
  checkBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkText: {
    color: colors.mutedText,
    fontSize: 16,
    fontWeight: '700',
  },
  checkTextCompleted: {
    color: '#FFFFFF',
  },

  // Set actions
  setActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addSetBtn: {
    flex: 1,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSetText: {
    color: colors.secondaryText,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  removeSetBtn: {
    backgroundColor: colors.danger + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger + '22',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  removeSetText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: '700',
  },

  // Add Exercise
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    borderStyle: 'dashed',
    backgroundColor: colors.primary + '08',
  },
  addExerciseIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '300',
  },
  addExerciseText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '700',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  exerciseList: {
    flex: 1,
  },
  exercisePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    marginBottom: 4,
  },
  exercisePickerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exercisePickerAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  exercisePickerInfo: {
    flex: 1,
    gap: 2,
  },
  exercisePickerName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  exercisePickerMuscle: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },

  // Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  dialogTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '800',
  },
  dialogBody: {
    color: colors.secondaryText,
    fontSize: typography.body,
    lineHeight: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dialogBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  dialogCancelBtn: {
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogConfirmBtn: {
    backgroundColor: colors.primary,
  },
  dialogDangerBtn: {
    backgroundColor: colors.danger,
  },
  dialogCancelText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  dialogConfirmText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
  dialogDangerText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '800',
  },
});
