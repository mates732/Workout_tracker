import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
  PanResponder,
  Animated,
} from 'react-native';

const EXERCISES_LIBRARY = [
  { id: 1, name: 'Squat', muscle: 'Legs' },
  { id: 2, name: 'Deadlift', muscle: 'Back' },
  { id: 3, name: 'Deadlift (Trap Bar)', muscle: 'Back' },
  { id: 4, name: 'Bench Press', muscle: 'Chest' },
  { id: 5, name: 'Overhead Press', muscle: 'Shoulders' },
  { id: 6, name: 'Pull-Up', muscle: 'Back' },
  { id: 7, name: 'Barbell Row', muscle: 'Back' },
  { id: 8, name: 'Romanian Deadlift', muscle: 'Back' },
  { id: 9, name: 'Leg Press', muscle: 'Legs' },
  { id: 10, name: 'Bulgarian Split Squat', muscle: 'Legs' },
  { id: 11, name: 'Hip Thrust', muscle: 'Glutes' },
  { id: 12, name: 'Incline Bench Press', muscle: 'Chest' },
  { id: 13, name: 'Cable Row', muscle: 'Back' },
  { id: 14, name: 'Lat Pulldown', muscle: 'Back' },
  { id: 15, name: 'Dumbbell Curl', muscle: 'Arms' },
  { id: 16, name: 'Tricep Pushdown', muscle: 'Arms' },
  { id: 17, name: 'Lateral Raise', muscle: 'Shoulders' },
  { id: 18, name: 'Face Pull', muscle: 'Shoulders' },
  { id: 19, name: 'Calf Raise', muscle: 'Legs' },
  { id: 20, name: 'Plank', muscle: 'Core' },
];

const SET_TYPES = [
  { id: 'normal', label: '1', tag: 'Normal' },
  { id: 'warmup', label: 'W', tag: 'Warmup' },
  { id: 'dropset', label: 'D', tag: 'Drop Set' },
  { id: 'failure', label: 'F', tag: 'Failure' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1212',
  },
  topBar: {
    backgroundColor: 'rgba(10,10,10,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarButtonText: {
    color: '#F9F6EE',
    fontSize: 12,
    fontWeight: '600',
  },
  timerButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    color: '#F9F6EE',
  },
  timerText: {
    color: '#F9F6EE',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyState: {
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonLarge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#F9F6EE',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9F6EE',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#F9F6EE',
  },
  setRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  setRowCompleted: {
    backgroundColor: '#AFE1AF',
    borderColor: 'rgba(175,225,175,0.3)',
  },
  setInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    color: '#F9F6EE',
    padding: 6,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderColor: 'rgba(0,0,0,0.15)',
    color: '#1B1212',
  },
  addSetButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  addSetText: {
    color: 'rgba(249,246,238,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    backgroundColor: '#1B1212',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '85%',
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#F9F6EE',
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#F9F6EE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  exerciseItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#1B1212',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 24,
    maxWidth: 300,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#F9F6EE',
  },
  dialogText: {
    fontSize: 14,
    color: 'rgba(249,246,238,0.7)',
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dialogButtonConfirm: {
    backgroundColor: '#AFE1AF',
  },
  dialogButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  dialogButtonCancelText: {
    color: '#F9F6EE',
  },
  dialogButtonConfirmText: {
    color: '#1B1212',
  },
});

export default function WorkoutLoggerNative() {
  const [startTime] = useState(new Date());
  const [exercises, setExercises] = useState<any[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds(e => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleAddExercise = (exercise: any) => {
    const newExercise = {
      id: `ex-${Date.now()}`,
      libraryId: exercise.id,
      name: exercise.name,
      notes: '',
      restTimer: null,
      sets: [
        {
          id: `set-${Date.now()}`,
          kg: null,
          reps: null,
          completed: false,
          type: 'normal',
          previous: null,
        },
      ],
    };
    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
  };

  const handleSetChange = (exId: string, setId: string, field: string, value: any) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s: any) => {
          if (s.id !== setId) return s;
          return {
            ...s,
            [field]: (field === 'kg' || field === 'reps') && value ? Number(value) : value,
          };
        }),
      };
    }));
  };

  const handleAddSet = (exId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id !== exId) return ex;
      return {
        ...ex,
        sets: [
          ...ex.sets,
          {
            id: `set-${Date.now()}`,
            kg: null,
            reps: null,
            completed: false,
            type: 'normal',
            previous: null,
          },
        ],
      };
    }));
  };

  const handleRemoveExercise = (exId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exId));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarButton}>
          <Text style={styles.topBarButtonText}>⌄ Log</Text>
        </View>
        <TouchableOpacity style={styles.timerButton}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.topBarButtonText}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity style={styles.addButtonLarge} onPress={() => setShowExercisePicker(true)}>
              <Text style={{ fontSize: 20, color: '#F9F6EE' }}>+</Text>
              <Text style={styles.addButtonText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {exercises.map((exercise: any) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                {/* Header */}
                <View style={styles.exerciseHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{exercise.name[0]}</Text>
                  </View>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <TouchableOpacity>
                    <Text style={{ fontSize: 18, color: 'rgba(249,246,238,0.5)' }}>⋮</Text>
                  </TouchableOpacity>
                </View>

                {/* Sets */}
                {exercise.sets.map((set: any, idx: number) => (
                  <View
                    key={set.id}
                    style={[styles.setRow, set.completed && styles.setRowCompleted]}
                  >
                    <Text style={{ color: set.completed ? '#1B1212' : '#F9F6EE', fontWeight: '700' }}>
                      {SET_TYPES.find(t => t.id === set.type)?.label}
                    </Text>
                    <TextInput
                      placeholder="0"
                      value={set.kg?.toString() ?? ''}
                      onChangeText={(text) => handleSetChange(exercise.id, set.id, 'kg', text)}
                      editable={!set.completed}
                      keyboardType="decimal-pad"
                      style={[styles.setInput, set.completed && styles.setInputCompleted]}
                    />
                    <TextInput
                      placeholder="0"
                      value={set.reps?.toString() ?? ''}
                      onChangeText={(text) => handleSetChange(exercise.id, set.id, 'reps', text)}
                      editable={!set.completed}
                      keyboardType="number-pad"
                      style={[styles.setInput, set.completed && styles.setInputCompleted]}
                    />
                    <TouchableOpacity
                      onPress={() => handleSetChange(exercise.id, set.id, 'completed', !set.completed)}
                    >
                      <Text style={{ fontSize: 16, color: set.completed ? '#1B1212' : 'rgba(249,246,238,0.5)' }}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Set */}
                <TouchableOpacity style={styles.addSetButton} onPress={() => handleAddSet(exercise.id)}>
                  <Text style={{ fontSize: 14, color: 'rgba(249,246,238,0.7)' }}>+</Text>
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Exercise Button */}
            <TouchableOpacity
              style={[
                styles.addSetButton,
                { borderStyle: 'dashed', marginTop: 8, justifyContent: 'center' },
              ]}
              onPress={() => setShowExercisePicker(true)}
            >
              <Text style={{ fontSize: 16, color: 'rgba(249,246,238,0.6)' }}>+</Text>
              <Text style={[styles.addSetText, { color: 'rgba(249,246,238,0.6)' }]}>Add Exercise</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>Select Exercise</Text>
            <TextInput
              placeholder="Search exercises…"
              placeholderTextColor="rgba(249,246,238,0.5)"
              style={styles.searchInput}
            />
            <FlatList
              data={EXERCISES_LIBRARY}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.exerciseItem} onPress={() => handleAddExercise(item)}>
                  <View style={styles.exerciseItemAvatar}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={{ fontWeight: '700', color: '#F9F6EE' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(249,246,238,0.5)' }}>{item.muscle}</Text>
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={true}
            />
            <TouchableOpacity
              style={{ marginTop: 12 }}
              onPress={() => setShowExercisePicker(false)}
            >
              <Text style={{ color: '#F9F6EE', textAlign: 'center', fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Finish Confirm Modal */}
      <Modal visible={showFinishConfirm} transparent>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Finish Workout?</Text>
            <Text style={styles.dialogText}>Total time: {formatTime(elapsedSeconds)}</Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => setShowFinishConfirm(false)}
              >
                <Text style={[styles.dialogButtonText, styles.dialogButtonCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonConfirm]}
                onPress={() => {
                  setShowFinishConfirm(false);
                  setExercises([]);
                }}
              >
                <Text style={[styles.dialogButtonText, styles.dialogButtonConfirmText]}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
