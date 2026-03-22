import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SetRow from './SetRow';
import { useWorkoutContext } from '../state/workoutContext';

type ExerciseCardProps = {
  exercise: {
    id: string;
    name: string;
    sets: Array<{
      id: string;
      type: string;
      weight: number;
      reps: number;
      completed: boolean;
    }>;
  };
};

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const { openExerciseDetail, toggleSetComplete, updateSetValue } = useWorkoutContext();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => openExerciseDetail(exercise.id)}><Text style={styles.icon}>?</Text></TouchableOpacity>
        <Text style={styles.name}>{exercise.name.toUpperCase()}</Text>
        <TouchableOpacity><Text style={styles.menu}>⋮</Text></TouchableOpacity>
      </View>
      <View style={styles.setHeader}>
        <Text style={styles.setLabel}>SET</Text>
        <Text style={styles.setLabel}>WEIGHT</Text>
        <Text style={styles.setLabel}>REPS</Text>
      </View>
      <View>
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            onCheck={() => toggleSetComplete(exercise.id, set.id)}
            onUpdateWeight={(value) => updateSetValue(exercise.id, set.id, 'weight', value)}
            onUpdateReps={(value) => updateSetValue(exercise.id, set.id, 'reps', value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
    paddingBottom: 10,
  },
  icon: { color: '#C6C6C6', fontSize: 16, fontWeight: '700' },
  name: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  menu: { color: '#C6C6C6', fontSize: 18 },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  setLabel: {
    color: '#9A9A9A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
