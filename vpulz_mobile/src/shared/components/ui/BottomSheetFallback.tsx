import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type BottomSheetModalHandle = {
  present: () => void;
  dismiss: () => void;
};

type BottomSheetModalProps = PropsWithChildren<{
  snapPoints?: Array<string | number>;
  backgroundStyle?: StyleProp<ViewStyle>;
  handleIndicatorStyle?: StyleProp<ViewStyle>;
}>;

type BottomSheetScrollViewProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

function resolveSheetHeight(snapPoints?: Array<string | number>): number {
  const screenHeight = Dimensions.get('window').height;
  const first = snapPoints?.[0];

  if (typeof first === 'number' && Number.isFinite(first)) {
    return Math.max(260, Math.min(screenHeight * 0.95, first));
  }

  if (typeof first === 'string') {
    const match = first.trim().match(/^([0-9]+(?:\.[0-9]+)?)%$/);
    if (match) {
      const ratio = Number.parseFloat(match[1]) / 100;
      if (Number.isFinite(ratio)) {
        return Math.max(260, Math.min(screenHeight * 0.95, screenHeight * ratio));
      }
    }
  }

  return Math.round(screenHeight * 0.64);
}

export const BottomSheetModalProvider = ({ children }: PropsWithChildren) => <>{children}</>;

export const BottomSheetModal = forwardRef<BottomSheetModalHandle, BottomSheetModalProps>(
  function BottomSheetModal({ children, snapPoints, backgroundStyle, handleIndicatorStyle }, ref) {
    const [visible, setVisible] = useState(false);
    const sheetHeight = useMemo(() => resolveSheetHeight(snapPoints), [snapPoints]);

    useImperativeHandle(
      ref,
      () => ({
        present: () => setVisible(true),
        dismiss: () => setVisible(false),
      }),
      []
    );

    return (
      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={[styles.sheet, { height: sheetHeight }, backgroundStyle]}>
            <View style={[styles.handleIndicator, handleIndicatorStyle]} />
            {children}
          </View>
        </View>
      </Modal>
    );
  }
);

export function BottomSheetScrollView({ children, contentContainerStyle }: BottomSheetScrollViewProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={contentContainerStyle}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: '#111214',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  handleIndicator: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#6B7280',
    marginTop: 10,
    marginBottom: 6,
  },
});
