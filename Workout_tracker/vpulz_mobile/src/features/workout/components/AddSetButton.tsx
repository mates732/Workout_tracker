import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type AddSetButtonProps = {
  onPress: () => void;
};

export default function AddSetButton({ onPress }: AddSetButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>+ Add Set</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  text: {
    color: '#131313',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
