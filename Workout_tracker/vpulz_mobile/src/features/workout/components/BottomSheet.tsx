import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import type { PropsWithChildren } from 'react';

type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
}>;

export default function BottomSheet({ visible, children }: BottomSheetProps) {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.sheet}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#23242b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, minHeight: 200 },
});
