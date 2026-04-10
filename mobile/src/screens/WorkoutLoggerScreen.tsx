import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { CalendarWorkout } from "../state/WorkoutLoggerContext";
import { useWorkoutLogger } from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, splitColors, splitLabel, typography } from "../theme/workoutLoggerTheme";
import { formatDateLabel, fromDateKey } from "../utils/workoutLoggerDate";
import WorkoutCalendar from "./components/WorkoutCalendar";
import DayDetailPanel from "./components/DayDetailPanel";

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, "Home">;

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg}kg`;
}

export default function WorkoutLoggerScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavigation>();
  const {
    selectedDate,
    setSelectedDate,
    calendarDays,
    workoutsForSelectedDate,
    routineTemplates,
    weeklyStats,
    lastCompletedWorkout,
    workout,
    ensureWorkout,
    startRoutineWorkout,
    startWorkoutFromCalendarEntry,
    markSickDay,
    undoSickDay,
    moveWorkout,
    switchRoutineOnDate,
  } = useWorkoutLogger();

  const [monthDate, setMonthDate] = useState<Date>(() => fromDateKey(selectedDate));
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    setMonthDate(fromDateKey(selectedDate));
  }, [selectedDate]);

  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);
  const dayInfo = calendarDays[selectedDate];

  const handleSelectDate = (dateKey: string): void => {
    setSelectedDate(dateKey);
    setMonthDate(fromDateKey(dateKey));
    setPanelVisible(true);
  };

  const handleStartWorkout = (entry: CalendarWorkout): void => {
    setPanelVisible(false);
    startWorkoutFromCalendarEntry(entry);
    navigation.navigate("Workout");
  };

  const openWorkout = (): void => {
    ensureWorkout();
    navigation.navigate("Workout");
  };

  const openCalendar = (): void => {
    navigation.navigate("Calendar");
  };

  const startRoutine = (routineId: string): void => {
    const routine = routineTemplates.find((item) => item.id === routineId);
    if (!routine) return;
    startRoutineWorkout(routine);
    navigation.navigate("Workout");
  };

  const resumeWorkout = (): void => {
    navigation.navigate("Workout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Training</Text>
          <Text style={styles.heroTitle}>Workout Tracker</Text>
          <Text style={styles.heroBody}>Calendar, sessions, and exercise flow in one place.</Text>
        </View>

        {/* Active workout banner */}
        {workout && (
          <Pressable style={styles.activeBanner} onPress={resumeWorkout}>
            <View style={styles.activePulse} />
            <View style={styles.activeCopy}>
              <Text style={styles.activeBannerTitle}>Workout in progress</Text>
              <Text style={styles.activeBannerMeta}>{workout.title} · {workout.exercises.length} exercises</Text>
            </View>
            <Text style={styles.activeBannerChevron}>›</Text>
          </Pressable>
        )}

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={openWorkout}>
            <Text style={styles.primaryButtonText}>
              {workout ? "Continue Workout" : "Start Workout"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openCalendar}>
            <Text style={styles.secondaryButtonText}>Full Calendar</Text>
          </Pressable>
        </View>

        {/* Weekly stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{weeklyStats.workoutCount}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {weeklyStats.totalVolume > 0 ? formatVolume(weeklyStats.totalVolume) : "—"}
            </Text>
            <Text style={styles.statLabel}>Volume (7d)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {lastCompletedWorkout ? lastCompletedWorkout.durationMin + "m" : "—"}
            </Text>
            <Text style={styles.statLabel}>Last Session</Text>
          </View>
        </View>

        {/* Last completed workout */}
        {lastCompletedWorkout && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Last Workout</Text>
            <View style={styles.lastWorkoutRow}>
              {lastCompletedWorkout.split && (
                <View style={[styles.splitPill, { backgroundColor: `${splitColors[lastCompletedWorkout.split].bright}1A` }]}>
                  <View style={[styles.splitPillDot, { backgroundColor: splitColors[lastCompletedWorkout.split].bright }]} />
                  <Text style={[styles.splitPillText, { color: splitColors[lastCompletedWorkout.split].bright }]}>
                    {splitLabel[lastCompletedWorkout.split].toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.lastWorkoutDate}>{formatDateLabel(lastCompletedWorkout.dateKey)}</Text>
            </View>
            <Text style={styles.lastWorkoutTitle}>{lastCompletedWorkout.title}</Text>
            <View style={styles.lastWorkoutMeta}>
              <Text style={styles.lastWorkoutMetaItem}>{lastCompletedWorkout.durationMin} min</Text>
              <Text style={styles.lastWorkoutMetaDot}>·</Text>
              <Text style={styles.lastWorkoutMetaItem}>{lastCompletedWorkout.exercises.length} exercises</Text>
              {(lastCompletedWorkout.totalVolume ?? 0) > 0 && (
                <>
                  <Text style={styles.lastWorkoutMetaDot}>·</Text>
                  <Text style={styles.lastWorkoutMetaItem}>{formatVolume(lastCompletedWorkout.totalVolume!)} volume</Text>
                </>
              )}
            </View>
            {lastCompletedWorkout.exercises.length > 0 && (
              <Text style={styles.lastWorkoutExercises} numberOfLines={2}>
                {lastCompletedWorkout.exercises.join(" · ")}
              </Text>
            )}
          </View>
        )}

        {/* Calendar card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <WorkoutCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            calendarDays={calendarDays}
            onSelectDate={handleSelectDate}
            onChangeMonth={setMonthDate}
          />
        </View>

        {/* Today's workout preview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selectedDateLabel}</Text>
          {dayInfo && (
            <View style={[styles.splitBadge, { backgroundColor: `${splitColors[dayInfo.split].bright}18` }]}>
              <View style={[styles.splitDot, { backgroundColor: splitColors[dayInfo.split].bright }]} />
              <Text style={[styles.splitText, { color: splitColors[dayInfo.split].bright }]}>
                {splitLabel[dayInfo.split].toUpperCase()}
              </Text>
              <Text style={styles.splitStatusText}>
                {dayInfo.status === "completed" ? "· Completed" :
                 dayInfo.status === "missed" ? "· Missed" :
                 dayInfo.status === "sick" ? "· Sick Day" : "· Planned"}
              </Text>
            </View>
          )}

          {workoutsForSelectedDate.length > 0 ? (
            workoutsForSelectedDate.map((entry) => (
              <View key={entry.id} style={styles.workoutItem}>
                <View style={styles.workoutItemCopy}>
                  <Text style={styles.workoutItemTitle}>{entry.title}</Text>
                  <Text style={styles.workoutItemMeta}>
                    {entry.source === "completed"
                      ? `Completed · ${entry.durationMin} min · ${entry.exercises.length} exercises`
                      : entry.source === "sick"
                      ? "Sick Day"
                      : `${entry.exercises.length} exercises · ~${entry.durationMin} min`}
                  </Text>
                </View>
                {entry.source !== "sick" && entry.source !== "completed" && (
                  <Pressable
                    style={styles.workoutItemAction}
                    onPress={() => handleStartWorkout(entry)}
                  >
                    <Text style={styles.workoutItemActionText}>Start</Text>
                  </Pressable>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Rest day — no workout scheduled.</Text>
          )}
        </View>

        {/* Routines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved Routines</Text>
          {routineTemplates.map((routine) => (
            <View key={routine.id} style={styles.routineItem}>
              <View style={styles.routineCopy}>
                <View style={styles.routineNameRow}>
                  <View style={[styles.routineDot, { backgroundColor: splitColors[routine.split].bright }]} />
                  <Text style={styles.routineName}>{routine.name}</Text>
                </View>
                <Text style={styles.routineMeta}>{routine.exercises.length} exercises</Text>
              </View>
              <Pressable style={styles.routineAction} onPress={() => startRoutine(routine.id)}>
                <Text style={styles.routineActionText}>Start</Text>
              </Pressable>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Day panel overlay */}
      <DayDetailPanel
        visible={panelVisible}
        selectedDate={selectedDate}
        dayInfo={dayInfo}
        workouts={workoutsForSelectedDate}
        routines={routineTemplates}
        onClose={() => setPanelVisible(false)}
        onStartWorkout={handleStartWorkout}
        onMarkSick={markSickDay}
        onUndoSick={undoSickDay}
        onMove={moveWorkout}
        onSwitch={switchRoutineOnDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bgDeep },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heroCard: {
    marginTop: spacing.md,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroKicker: {
    color: palette.accent,
    fontSize: typography.tiny,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  heroTitle: {
    color: palette.text,
    fontSize: typography.hero,
    fontWeight: "900",
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: typography.body,
    lineHeight: 20,
  },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activePulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.accent,
  },
  activeCopy: { flex: 1 },
  activeBannerTitle: {
    color: palette.accentLight,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  activeBannerMeta: {
    color: palette.textDim,
    fontSize: typography.tiny,
    marginTop: 2,
  },
  activeBannerChevron: {
    color: palette.accent,
    fontSize: 20,
    fontWeight: "700",
  },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: palette.accentLight,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: palette.textMuted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  // ── Weekly stats ──────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: "hidden",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: 3,
  },
  statValue: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statDivider: {
    width: 1,
    backgroundColor: palette.cardBorder,
    alignSelf: "stretch",
    marginVertical: spacing.sm,
  },
  // ── Card ──────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  // ── Last workout ──────────────────────────────────────────────────────────────
  lastWorkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  splitPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  splitPillDot: { width: 6, height: 6, borderRadius: 3 },
  splitPillText: { fontSize: typography.tiny, fontWeight: "800", letterSpacing: 0.8 },
  lastWorkoutDate: {
    color: palette.textDim,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  lastWorkoutTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  lastWorkoutMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  lastWorkoutMetaItem: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  lastWorkoutMetaDot: {
    color: palette.textDim,
    fontSize: typography.caption,
  },
  lastWorkoutExercises: {
    color: palette.textDim,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  // ── Split badge ───────────────────────────────────────────────────────────────
  splitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  splitDot: { width: 7, height: 7, borderRadius: 3.5 },
  splitText: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  splitStatusText: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  // ── Workout items ─────────────────────────────────────────────────────────────
  workoutItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  workoutItemCopy: { flex: 1 },
  workoutItemTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  workoutItemMeta: {
    marginTop: 2,
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  workoutItemAction: {
    minHeight: 40,
    minWidth: 74,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  workoutItemActionText: {
    color: palette.accentLight,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  emptyText: {
    color: palette.textDim,
    fontSize: typography.caption,
  },
  // ── Routines ──────────────────────────────────────────────────────────────────
  routineItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  routineCopy: { flex: 1, gap: 2 },
  routineNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  routineDot: { width: 8, height: 8, borderRadius: 4 },
  routineName: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  routineMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
    paddingLeft: 15,
  },
  routineAction: {
    minHeight: 40,
    minWidth: 70,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.accentBorder,
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  routineActionText: {
    color: palette.accentLight,
    fontSize: typography.caption,
    fontWeight: "800",
  },
});
