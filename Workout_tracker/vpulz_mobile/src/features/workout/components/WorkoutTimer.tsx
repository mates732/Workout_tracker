import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type WorkoutTimerProps = {
  timer: {
    seconds: number;
    mode: 'stopwatch' | 'rest';
  };
};

export default function WorkoutTimer({ timer }: WorkoutTimerProps) {
  return (
    <TouchableOpacity style={styles.timer}>
      <Text style={styles.mode}>{timer.mode === 'stopwatch' ? 'WORKOUT TIMER' : 'REST TIMER'}</Text>
      <Text style={styles.time}>{formatTime(timer.seconds)}</Text>
    </TouchableOpacity>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

const styles = StyleSheet.create({
  timer: {
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#1B1B1B',
    borderRadius: 10,
    gap: 4,
  },
  time: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  mode: {
    color: '#A0A0A0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
