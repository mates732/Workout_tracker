import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { CalendarWorkout } from "../state/WorkoutLoggerContext";
import { useWorkoutLogger } from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, typography } from "../theme/workoutLoggerTheme";
import { fromDateKey } from "../utils/workoutLoggerDate";
import DayDetailPanel from "./components/DayDetailPanel";
import WorkoutCalendar from "./components/WorkoutCalendar";

type CalendarNavigation = NativeStackNavigationProp<RootStackParamList, "Calendar">;

export default function CalendarScreen(): React.JSX.Element {
  const navigation = useNavigation<CalendarNavigation>();
  const {
    selectedDate,
    setSelectedDate,
    calendarDays,
    workoutsForSelectedDate,
    routineTemplates,
    startWorkoutFromCalendarEntry,
    markSickDay,
    undoSickDay,
    moveWorkout,
    switchRoutineOnDate,
  } = useWorkoutLogger();

  const [monthDate, setMonthDate] = useState<Date>(() => fromDateKey(selectedDate));
  const [panelVisible, setPanelVisible] = useState(false);

  const dayInfo = calendarDays[selectedDate];

  const handleSelectDate = (dateKey: string): void => {
    setSelectedDate(dateKey);
    setMonthDate(fromDateKey(dateKey));
    setPanelVisible(true);
  };

  const handleClosePanel = (): void => {
    setPanelVisible(false);
  };

  const handleStartWorkout = (entry: CalendarWorkout): void => {
    setPanelVisible(false);
    startWorkoutFromCalendarEntry(entry);
    navigation.navigate("Workout");
  };

  // Stat counts for header strip
  const stats = useMemo(() => {
    const days = Object.values(calendarDays);
    return {
      completed: days.filter((d) => d.status === "completed").length,
      upcoming: days.filter((d) => d.status === "future").length,
      missed: days.filter((d) => d.status === "missed").length,
    };
  }, [calendarDays]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Your training schedule</Text>
        </View>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.missed}</Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <WorkoutCalendar
          monthDate={monthDate}
          selectedDate={selectedDate}
          calendarDays={calendarDays}
          onSelectDate={handleSelectDate}
          onChangeMonth={setMonthDate}
        />
      </View>

      {/* Day detail panel + backdrop */}
      <DayDetailPanel
        visible={panelVisible}
        selectedDate={selectedDate}
        dayInfo={dayInfo}
        workouts={workoutsForSelectedDate}
        routines={routineTemplates}
        onClose={handleClosePanel}
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
  safeArea: {
    flex: 1,
    backgroundColor: palette.bgDeep,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  subtitle: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
    marginTop: 1,
  },
  backButton: {
    minHeight: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginTop: 4,
  },
  backButtonText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    paddingVertical: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNumber: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "900",
  },
  statLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: palette.cardBorder,
  },
  calendarCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    padding: spacing.md,
  },
});
