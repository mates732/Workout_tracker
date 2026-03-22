import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

type SetRowProps = {
  set: {
    id: string;
    type: string;
    weight: number;
    reps: number;
    completed: boolean;
  };
  onCheck: () => void;
  onUpdateWeight: (value: number) => void;
  onUpdateReps: (value: number) => void;
};

export default function SetRow({ set, onCheck, onUpdateWeight, onUpdateReps }: SetRowProps) {
  return (
    <View style={[styles.row, set.completed && styles.completed]}> 
      <Text style={styles.setNum}>{set.type}</Text>
      <TextInput
        style={styles.input}
        value={String(set.weight || '')}
        keyboardType="decimal-pad"
        onChangeText={(value) => onUpdateWeight(Number(value) || 0)}
      />
      <TextInput
        style={styles.input}
        value={String(set.reps || '')}
        keyboardType="number-pad"
        onChangeText={(value) => onUpdateReps(Number(value) || 0)}
      />
      <TouchableOpacity onPress={onCheck}><Text style={styles.check}>{set.completed ? '●' : '○'}</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 6,
  },
  setNum: {
    color: '#FFFFFF',
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#131313',
    color: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 8,
    marginHorizontal: 4,
    width: 72,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
  },
  check: { color: '#72FF70', fontSize: 18, marginLeft: 8 },
  completed: { backgroundColor: '#152117', borderColor: '#2A3D2D' },
});
