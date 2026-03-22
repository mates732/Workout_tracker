import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../services/api';
import { Workout, RootStackParamList } from '../types';

type WorkoutDetailRouteProp = RouteProp<RootStackParamList, 'WorkoutDetail'>;

export default function WorkoutDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getWorkout(workoutId)
      .then(setWorkout)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [workoutId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Workout not found.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{workout.name}</Text>
      {workout.description ? (
        <Text style={styles.description}>{workout.description}</Text>
      ) : null}
      {workout.duration_minutes ? (
        <Text style={styles.meta}>Duration: {workout.duration_minutes} min</Text>
      ) : null}

      <Text style={styles.sectionHeader}>Exercises</Text>
      {workout.exercises.map((exercise) => (
        <View key={exercise.id} style={styles.exerciseCard}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          {exercise.muscle_group ? (
            <Text style={styles.exerciseMeta}>Muscle: {exercise.muscle_group}</Text>
          ) : null}
          {exercise.equipment ? (
            <Text style={styles.exerciseMeta}>Equipment: {exercise.equipment}</Text>
          ) : null}
          {exercise.sets.map((set) => (
            <Text key={set.set_number} style={styles.setRow}>
              Set {set.set_number}
              {set.reps != null ? `: ${set.reps} reps` : ''}
              {set.weight_kg != null ? ` @ ${set.weight_kg} kg` : ''}
              {set.duration_seconds != null ? ` · ${set.duration_seconds}s` : ''}
            </Text>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={styles.logButton}
        onPress={() => navigation.navigate('LogWorkout', { workoutId: workout.id })}
      >
        <Text style={styles.logButtonText}>Log This Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 12,
    marginTop: 8,
  },
  exerciseCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  setRow: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    marginLeft: 8,
  },
  logButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
});
