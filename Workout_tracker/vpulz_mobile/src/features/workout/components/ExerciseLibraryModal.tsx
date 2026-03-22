import React from 'react';
import { Pressable, View, Text, Modal, StyleSheet } from 'react-native';

type ExerciseLibraryModalProps = {
  visible: boolean;
  onOpenAddExercise: () => void;
  onClose: () => void;
};

export default function ExerciseLibraryModal({ visible, onOpenAddExercise, onClose }: ExerciseLibraryModalProps) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>LIBRARY</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>CLOSE</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Search, filter, and exercise list</Text>
          <Pressable style={styles.actionButton} onPress={onOpenAddExercise}>
            <Text style={styles.actionText}>OPEN EXERCISE LIBRARY</Text>
          </Pressable>
        </View>
      </View>
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
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  close: { color: '#C6C6C6', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: {
    color: '#9A9A9A',
    fontSize: 12,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#131313',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
