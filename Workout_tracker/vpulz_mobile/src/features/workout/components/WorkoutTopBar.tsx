import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkoutContext } from '../state/workoutContext';

export default function WorkoutTopBar() {
  const { minimizeWorkout, openExerciseLibrary } = useWorkoutContext();

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.leftCluster} onPress={minimizeWorkout}>
        <Text style={styles.glyph}>◈</Text>
        <Text style={styles.brand}>VPULZ</Text>
      </TouchableOpacity>
      <Text style={styles.timer}>IN SESSION</Text>
      <TouchableOpacity style={styles.finishButton} onPress={openExerciseLibrary}><Text style={styles.finishText}>ADD</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    backgroundColor: '#131313',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A2A',
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  glyph: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.7,
  },
  timer: {
    color: '#9A9A9A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  finishButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
