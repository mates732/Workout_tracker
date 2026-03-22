import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Workout } from '../types';

export default function WorkoutListScreen() {
  const navigation = useNavigation<any>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getWorkouts()
      .then(setWorkouts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Could not connect to server.</Text>
        <Text style={styles.errorHint}>
          Make sure the backend is running and that EXPO_PUBLIC_API_URL points to
          the correct IP address (not "localhost") when testing on a physical
          device.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={workouts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDescription}>{item.description}</Text>
          ) : null}
          <Text style={styles.cardMeta}>
            {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
            {item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No workouts found.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
