import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type MinimizedWorkoutBarProps = {
  onPress: () => void;
};

export default function MinimizedWorkoutBar({ onPress }: MinimizedWorkoutBarProps) {
  return (
    <TouchableOpacity style={styles.bar} onPress={onPress}>
      <View>
        <Text style={styles.name}>CURRENT SESSION</Text>
        <Text style={styles.sub}>PUSH DAY A</Text>
      </View>
      <Text style={styles.timer}>00:00:00 ▲</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    elevation: 8,
  },
  name: { color: '#131313', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  sub: { color: '#131313', fontSize: 13, fontWeight: '700', marginTop: 1 },
  timer: { color: '#131313', fontSize: 12, fontWeight: '800' },
});
