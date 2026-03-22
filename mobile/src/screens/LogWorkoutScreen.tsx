import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { api } from '../services/api';
import { RootStackParamList } from '../types';

type LogWorkoutRouteProp = RouteProp<RootStackParamList, 'LogWorkout'>;

export default function LogWorkoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<LogWorkoutRouteProp>();
  const { workoutId } = route.params;

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLog() {
    setSubmitting(true);
    try {
      await api.logWorkout(workoutId, notes.trim() || undefined);
      Alert.alert('Logged!', 'Your workout has been recorded.', [
        { text: 'OK', onPress: () => navigation.navigate('WorkoutHistory') },
      ]);
    } catch (err) {
      Alert.alert('Error', (err as Error).message ?? 'Failed to log workout.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="How did it go?"
        multiline
        numberOfLines={5}
        value={notes}
        onChangeText={setNotes}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.button} onPress={handleLog} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Save Log</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1e1b4b',
    marginBottom: 20,
    minHeight: 120,
  },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
