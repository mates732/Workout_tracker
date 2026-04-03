import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type ExerciseSet = {
  id: number;
  weight: number;
  reps: number;
  completed: boolean;
  type: 'normal';
};

type ExerciseItem = {
  id: number;
  name: string;
  sets: ExerciseSet[];
};

export function TrainingScreen() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);

  const addExercise = () => {
    const now = Date.now();
    setExercises((prev) => [
      {
        id: now,
        name: 'New Exercise',
        sets: [
          {
            id: now + 1,
            weight: 0,
            reps: 0,
            completed: false,
            type: 'normal',
          },
        ],
      },
      ...prev,
    ]);
  };

  const toggleSetDone = (exerciseId: number, setId: number) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((setItem) =>
                setItem.id === setId ? { ...setItem, completed: !setItem.completed } : setItem,
              ),
            }
          : exercise,
      ),
    );
  };

  const updateSet = (exerciseId: number, setId: number, field: 'weight' | 'reps', value: string) => {
    const parsed = field === 'weight' ? Number.parseFloat(value || '0') : Number.parseInt(value || '0', 10);
    const safeValue = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((setItem) =>
                setItem.id === setId ? { ...setItem, [field]: safeValue } : setItem,
              ),
            }
          : exercise,
      ),
    );
  };

  const addSet = (exerciseId: number) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: Date.now(),
              weight: lastSet?.weight ?? 0,
              reps: lastSet?.reps ?? 0,
              completed: false,
              type: 'normal',
            },
          ],
        };
      }),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>NEW WORKOUT SCREEN FIRE</Text>

      {exercises.map((exercise) => (
        <View key={exercise.id} style={styles.exerciseCard}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>

          {exercise.sets.map((setItem, index) => (
            <View key={setItem.id} style={[styles.setRow, setItem.completed ? styles.setRowCompleted : null]}>
              <Text style={styles.setIndex}>{index + 1}</Text>

              <TextInput
                value={String(setItem.weight)}
                onChangeText={(text) => updateSet(exercise.id, setItem.id, 'weight', text)}
                keyboardType="numeric"
                style={styles.input}
                placeholder="kg"
                placeholderTextColor="#9ca3af"
              />

              <TextInput
                value={String(setItem.reps)}
                onChangeText={(text) => updateSet(exercise.id, setItem.id, 'reps', text)}
                keyboardType="numeric"
                style={styles.input}
                placeholder="reps"
                placeholderTextColor="#9ca3af"
              />

              <Pressable
                onPress={() => toggleSetDone(exercise.id, setItem.id)}
                style={[styles.doneButton, setItem.completed ? styles.doneButtonCompleted : null]}
              >
                <Text style={styles.doneButtonText}>{setItem.completed ? '✓' : ''}</Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
            <Text style={styles.addSetButtonText}>+ Add Set</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.addExerciseButton} onPress={addExercise}>
        <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120,
    backgroundColor: '#050505',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  exerciseTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#222222',
  },
  setRowCompleted: {
    backgroundColor: '#163d2b',
  },
  setIndex: {
    width: 30,
    color: '#e5e7eb',
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#0f172a',
  },
  doneButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
  },
  doneButtonCompleted: {
    backgroundColor: '#16a34a',
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  addSetButton: {
    marginTop: 10,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetButtonText: {
    color: '#d1d5db',
    fontWeight: '600',
  },
  addExerciseButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addExerciseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
