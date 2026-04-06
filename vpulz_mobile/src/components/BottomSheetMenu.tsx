import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetModalHandle,
} from '../shared/components/ui/BottomSheetAdapter';

export type BottomSheetMenuAction = {
  id: string;
  label: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

type BottomSheetMenuProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actions?: BottomSheetMenuAction[];
  snapPoints?: Array<string | number>;
  onClose: () => void;
  children?: ReactNode;
};

function resolveSnapPoints(input?: Array<string | number>): Array<string | number> {
  if (!input || !input.length) {
    return ['48%'];
  }
  return input;
}

export default function BottomSheetMenu({
  visible,
  title,
  subtitle,
  actions = [],
  snapPoints,
  onClose,
  children,
}: BottomSheetMenuProps) {
  const sheetRef = useRef<BottomSheetModalHandle | null>(null);
  const resolvedSnapPoints = useMemo(() => resolveSnapPoints(snapPoints), [snapPoints]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      return;
    }
    sheetRef.current?.dismiss();
  }, [visible]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={resolvedSnapPoints}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonLabel}>Close</Text>
          </Pressable>
        </View>

        {children}

        {actions.length ? (
          <View style={styles.actionList}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => {
                  if (action.disabled) {
                    return;
                  }
                  action.onPress?.();
                  onClose();
                }}
                style={[styles.actionButton, action.disabled ? styles.actionDisabled : null]}
              >
                <Text style={[styles.actionLabel, action.destructive ? styles.actionLabelDestructive : null]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  handleIndicator: {
    backgroundColor: '#4B5563',
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  closeButton: {
    minHeight: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0B',
  },
  closeButtonLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionList: {
    gap: 8,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  actionLabelDestructive: {
    color: '#F87171',
  },
});
