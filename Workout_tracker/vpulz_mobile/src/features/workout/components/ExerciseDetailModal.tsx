import React from 'react';
import { Pressable, View, Text, Modal, StyleSheet } from 'react-native';

type ExerciseDetailModalProps = {
  visible: boolean;
  exercise: {
    id: string;
    name: string;
  } | null;
  onClose: () => void;
};

export default function ExerciseDetailModal({ visible, exercise, onClose }: ExerciseDetailModalProps) {
  if (!visible || !exercise) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{exercise.name.toUpperCase()}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>CLOSE</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Muscle groups, instructions, media, history and progress</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#131313',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#353535',
    alignSelf: 'center',
  },
  header: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.5, flex: 1, marginRight: 8 },
  close: { color: '#C6C6C6', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: {
    color: '#9A9A9A',
    fontSize: 12,
  },
});
