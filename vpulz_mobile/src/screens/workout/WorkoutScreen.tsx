// Legacy file — workout flow is now handled by features/workout/ActiveWorkoutScreen.tsx
import { View, Text, StyleSheet } from 'react-native';

export function WorkoutScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Legacy screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#6B6B80', fontSize: 16 },
});
