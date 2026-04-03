import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme/tokens';

interface Props {
  initialSeconds?: number;
  onFinish?: () => void;
}

const RestTimer: React.FC<Props> = ({ initialSeconds = 60, onFinish }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return undefined;
    if (seconds <= 0) {
      setRunning(false);
      onFinish?.();
      return undefined;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, running, onFinish]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Rest: {seconds}s</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setRunning((r) => !r)} style={styles.controlBtn}>
          <Text style={styles.controlText}>{running ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setSeconds(0);
            setRunning(false);
            onFinish?.();
          }}
          style={styles.controlBtn}
        >
          <Text style={styles.controlText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
    backgroundColor: colors.backgroundElevated,
    borderRadius: 10,
    alignItems: 'center',
  },
  text: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  controlBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  controlText: {
    color: colors.primaryText,
    fontWeight: '700',
  },
});

export default RestTimer;
