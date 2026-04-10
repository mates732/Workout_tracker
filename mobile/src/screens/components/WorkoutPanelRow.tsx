import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CalendarWorkout, DayInfo, SavedRoutine, SplitType } from "../../state/WorkoutLoggerContext";
import { palette, radius, spacing, splitColors, typography } from "../../theme/workoutLoggerTheme";

type WorkoutPanelRowProps = {
  workout: CalendarWorkout;
  dayInfo: DayInfo | undefined;
  routines: SavedRoutine[];
  isPast: boolean;
  dateKey: string;
  onStart: () => void;
  onMarkSick: () => void;
  onUndoSick: () => void;
  onMove: (toDateKey: string) => void;
  onSwitch: (routineId: string) => void;
};

function getSplitAccent(split: SplitType | null): string {
  if (!split) return palette.textDim;
  return splitColors[split].bright;
}

// Build next-7-days options for "Move to" sub-menu
function getMoveDates(baseKey: string): Array<{ label: string; dateKey: string }> {
  const [y, m, d] = baseKey.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const result: Array<{ label: string; dateKey: string }> = [];
  for (let i = 1; i <= 7; i++) {
    const date = new Date(base);
    date.setDate(date.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    result.push({
      label: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      dateKey: key,
    });
  }
  return result;
}

export default function WorkoutPanelRow({
  workout,
  dayInfo,
  routines,
  isPast,
  dateKey,
  onStart,
  onMarkSick,
  onUndoSick,
  onMove,
  onSwitch,
}: WorkoutPanelRowProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [submenu, setSubmenu] = useState<"switch" | "move" | null>(null);

  const accentColor = getSplitAccent(workout.split);
  const isSick = workout.source === "sick";
  const isCompleted = workout.source === "completed";

  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setSubmenu(null);
  }, []);

  const exerciseSummary = workout.exercises.slice(0, 4).join(", ") +
    (workout.exercises.length > 4 ? ` +${workout.exercises.length - 4}` : "");

  const moveDates = getMoveDates(dateKey);

  return (
    <View style={[styles.row, isSick && styles.rowSick]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        {/* Expand/collapse */}
        <Pressable style={styles.chevronButton} onPress={toggleExpanded}>
          <Text style={[styles.chevron, { color: accentColor }]}>
            {expanded ? "⌄" : "⌃"}
          </Text>
        </Pressable>

        {/* Workout name + status */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            {workout.split && (
              <View style={[styles.splitPill, { backgroundColor: `${accentColor}22` }]}>
                <View style={[styles.splitDot, { backgroundColor: accentColor }]} />
              </View>
            )}
            <Text style={[styles.workoutName, isSick && styles.workoutNameDim]} numberOfLines={1}>
              {isSick ? "Sick Day" : workout.title}
            </Text>
          </View>
          {!isSick && (
            <Text style={styles.workoutMeta} numberOfLines={1}>
              {isCompleted
                ? `✓ ${workout.durationMin} min · ${workout.exercises.length} exercises`
                : exerciseSummary}
            </Text>
          )}
        </View>

        {/* Triple-dot menu */}
        <Pressable style={styles.menuButton} onPress={openMenu}>
          <Text style={styles.menuDots}>{"•••"}</Text>
        </Pressable>
      </View>

      {/* Expanded exercise details */}
      {expanded && !isSick && (
        <View style={styles.exerciseList}>
          {(workout.exerciseDetails ?? workout.exercises.map((name) => ({ name, sets: [] }))).map(
            (ex: any, idx: number) => (
              <View key={`ex-${idx}`} style={styles.exerciseBlock}>
                <Text style={styles.exerciseName}>{typeof ex === "string" ? ex : ex.name}</Text>
                {typeof ex !== "string" && ex.sets?.length > 0 && (
                  <View style={styles.setList}>
                    {ex.sets.map((s: any, si: number) => (
                      <View key={`set-${si}`} style={styles.setRow}>
                        <Text style={styles.setLabel}>Set {si + 1}</Text>
                        <Text style={styles.setValues}>
                          {s.kg > 0 ? `${s.kg} kg` : "—"}
                          {"  "}×{"  "}
                          {s.reps > 0 ? `${s.reps} reps` : "—"}
                          {s.completed ? "  ✓" : ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {(typeof ex === "string" || !ex.sets?.length) && (
                  <Text style={styles.plannedHint}>Planned</Text>
                )}
              </View>
            )
          )}
          {isCompleted && workout.durationMin > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Duration: {workout.durationMin} min</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Menu Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>

            {submenu === null && (
              <>
                <Text style={styles.sheetTitle}>{workout.title}</Text>

                {!isPast && !isSick && (
                  <Pressable
                    style={styles.sheetItem}
                    onPress={() => { closeMenu(); onStart(); }}
                  >
                    <Text style={styles.sheetItemText}>Start Workout</Text>
                  </Pressable>
                )}

                <Pressable style={styles.sheetItem} onPress={() => setSubmenu("switch")}>
                  <Text style={styles.sheetItemText}>Switch Routine in Split</Text>
                  <Text style={styles.sheetItemArrow}>›</Text>
                </Pressable>

                {!isSick ? (
                  <Pressable
                    style={styles.sheetItem}
                    onPress={() => { closeMenu(); onMarkSick(); }}
                  >
                    <Text style={[styles.sheetItemText, styles.sheetItemDanger]}>Mark as Sick Day</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.sheetItem}
                    onPress={() => { closeMenu(); onUndoSick(); }}
                  >
                    <Text style={styles.sheetItemText}>Remove Sick Day</Text>
                  </Pressable>
                )}

                {!isPast && (
                  <Pressable style={styles.sheetItem} onPress={() => setSubmenu("move")}>
                    <Text style={styles.sheetItemText}>Move to Other Date</Text>
                    <Text style={styles.sheetItemArrow}>›</Text>
                  </Pressable>
                )}

                <Pressable style={[styles.sheetItem, styles.sheetCancel]} onPress={closeMenu}>
                  <Text style={[styles.sheetItemText, styles.sheetCancelText]}>Cancel</Text>
                </Pressable>
              </>
            )}

            {submenu === "switch" && (
              <>
                <Pressable style={styles.sheetBack} onPress={() => setSubmenu(null)}>
                  <Text style={styles.sheetBackText}>‹  Switch Routine</Text>
                </Pressable>
                <ScrollView style={styles.subScroll}>
                  {routines.map((r) => (
                    <Pressable
                      key={r.id}
                      style={[styles.sheetItem, r.id === workout.id && styles.sheetItemActive]}
                      onPress={() => { closeMenu(); onSwitch(r.id); }}
                    >
                      <View style={styles.routineRow}>
                        <View style={[styles.routineSplitDot, { backgroundColor: splitColors[r.split].bright }]} />
                        <Text style={styles.sheetItemText}>{r.name}</Text>
                      </View>
                      {r.exercises.length > 0 && (
                        <Text style={styles.routineMeta}>{r.exercises.length} exercises</Text>
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable style={[styles.sheetItem, styles.sheetCancel]} onPress={closeMenu}>
                  <Text style={[styles.sheetItemText, styles.sheetCancelText]}>Cancel</Text>
                </Pressable>
              </>
            )}

            {submenu === "move" && (
              <>
                <Pressable style={styles.sheetBack} onPress={() => setSubmenu(null)}>
                  <Text style={styles.sheetBackText}>‹  Move to Date</Text>
                </Pressable>
                <ScrollView style={styles.subScroll}>
                  {moveDates.map((item) => (
                    <Pressable
                      key={item.dateKey}
                      style={styles.sheetItem}
                      onPress={() => { closeMenu(); onMove(item.dateKey); }}
                    >
                      <Text style={styles.sheetItemText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable style={[styles.sheetItem, styles.sheetCancel]} onPress={closeMenu}>
                  <Text style={[styles.sheetItemText, styles.sheetCancelText]}>Cancel</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  rowSick: {
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 52,
  },
  chevronButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chevron: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  splitDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  workoutName: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
    flex: 1,
  },
  workoutNameDim: {
    color: palette.textDim,
  },
  workoutMeta: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "500",
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  menuDots: {
    color: palette.textMuted,
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: "700",
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  exerciseBlock: {
    gap: 4,
  },
  exerciseName: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  setList: {
    gap: 3,
    paddingLeft: spacing.sm,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  setLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
    width: 38,
  },
  setValues: {
    color: palette.textMuted,
    fontSize: typography.tiny,
    fontWeight: "500",
  },
  plannedHint: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontStyle: "italic",
    paddingLeft: spacing.sm,
  },
  summaryRow: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  summaryText: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  // ── Modal / ActionSheet ──────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: "#1E2B32",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingBottom: 28,
    overflow: "hidden",
  },
  sheetTitle: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sheetItemActive: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sheetItemText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  sheetItemArrow: {
    color: palette.textDim,
    fontSize: typography.subtitle,
    fontWeight: "400",
  },
  sheetItemDanger: {
    color: "#FF5050",
  },
  sheetCancel: {
    marginTop: spacing.xs,
    borderBottomWidth: 0,
  },
  sheetCancelText: {
    color: palette.textMuted,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  sheetBack: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sheetBackText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  subScroll: {
    maxHeight: 260,
  },
  routineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routineSplitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routineMeta: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "500",
  },
});
