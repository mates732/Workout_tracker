import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { WorkoutLog } from '../types';

export default function WorkoutHistoryScreen() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getWorkoutHistory();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLogs().finally(() => setLoading(false));
    }, [fetchLogs])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }

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
        <Text style={styles.errorText}>Could not load history.</Text>
        <Text style={styles.errorHint}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={logs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.workout_name}</Text>
          <Text style={styles.cardDate}>
            {new Date(item.logged_at).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {item.duration_minutes ? (
            <Text style={styles.cardMeta}>{item.duration_minutes} min</Text>
          ) : null}
          {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No workouts logged yet.</Text>
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: '#94a3b8',
  },
  cardNotes: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  errorHint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});
