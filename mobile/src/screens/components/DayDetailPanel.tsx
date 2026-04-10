import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  CalendarWorkout,
  DayInfo,
  SavedRoutine,
} from "../../state/WorkoutLoggerContext";
import { palette, radius, spacing, splitColors, splitLabel, typography } from "../../theme/workoutLoggerTheme";
import { formatDateLabel } from "../../utils/workoutLoggerDate";
import WorkoutPanelRow from "./WorkoutPanelRow";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const PANEL_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, 520);

type DayDetailPanelProps = {
  visible: boolean;
  selectedDate: string;
  dayInfo: DayInfo | undefined;
  workouts: CalendarWorkout[];
  routines: SavedRoutine[];
  onClose: () => void;
  onStartWorkout: (entry: CalendarWorkout) => void;
  onMarkSick: (dateKey: string) => void;
  onUndoSick: (dateKey: string) => void;
  onMove: (fromDateKey: string, toDateKey: string) => void;
  onSwitch: (dateKey: string, routineId: string) => void;
};

export default function DayDetailPanel({
  visible,
  selectedDate,
  dayInfo,
  workouts,
  routines,
  onClose,
  onStartWorkout,
  onMarkSick,
  onUndoSick,
  onMove,
  onSwitch,
}: DayDetailPanelProps): React.JSX.Element {
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: PANEL_HEIGHT,
          useNativeDriver: true,
          damping: 25,
          stiffness: 280,
          mass: 0.7,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropAnim]);

  const today = new Date().toISOString().slice(0, 10);
  const isPast = selectedDate < today;
  const dateLabel = formatDateLabel(selectedDate);
  const splitName = dayInfo ? splitLabel[dayInfo.split] : null;
  const accentColor = dayInfo ? splitColors[dayInfo.split].bright : palette.textDim;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sliding panel */}
      <Animated.View
        style={[
          styles.panel,
          { transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents={visible ? "auto" : "none"}
      >
        {/* Drag handle */}
        <View style={styles.handleBar}>
          <View style={styles.handle} />
        </View>

        {/* Date header */}
        <View style={styles.dateHeader}>
          <View style={styles.dateTextBlock}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            {splitName && (
              <View style={styles.splitBadge}>
                <View style={[styles.splitBadgeDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.splitBadgeText, { color: accentColor }]}>
                  {splitName.toUpperCase()}
                </Text>
              </View>
            )}
            {!splitName && !dayInfo && (
              <Text style={styles.restDayLabel}>REST DAY</Text>
            )}
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Workout panels */}
        <View style={styles.content}>
          {workouts.length === 0 && !dayInfo && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Rest Day</Text>
              <Text style={styles.emptyBody}>No workout scheduled. Recovery is part of the plan.</Text>
            </View>
          )}

          {workouts.map((workout) => (
            <WorkoutPanelRow
              key={workout.id}
              workout={workout}
              dayInfo={dayInfo}
              routines={routines}
              isPast={isPast}
              dateKey={selectedDate}
              onStart={() => onStartWorkout(workout)}
              onMarkSick={() => onMarkSick(selectedDate)}
              onUndoSick={() => onUndoSick(selectedDate)}
              onMove={(toKey) => onMove(selectedDate, toKey)}
              onSwitch={(routineId) => onSwitch(selectedDate, routineId)}
            />
          ))}

          {/* Start button for future/today planned workouts */}
          {!isPast && workouts.some((w) => w.source === "planned") && (
            <Pressable
              style={[styles.startButton, { borderColor: `${accentColor}55` }]}
              onPress={() => {
                const planned = workouts.find((w) => w.source === "planned");
                if (planned) onStartWorkout(planned);
              }}
            >
              <View style={[styles.startDot, { backgroundColor: accentColor }]} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 10,
  },
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: "#0F0F14",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    zIndex: 11,
  },
  handleBar: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  dateTextBlock: {
    gap: 4,
  },
  dateLabel: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  splitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  splitBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitBadgeText: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  restDayLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyTitle: {
    color: palette.textMuted,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  emptyBody: {
    color: palette.textDim,
    fontSize: typography.caption,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: spacing.xs,
  },
  startDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  startButtonText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
