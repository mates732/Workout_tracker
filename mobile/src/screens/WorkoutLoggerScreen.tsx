import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import WorkoutCalendar from "./components/WorkoutCalendar";
import {
  type CalendarWorkout,
  useWorkoutLogger,
} from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, typography } from "../theme/workoutLoggerTheme";
import { formatDateLabel, fromDateKey } from "../utils/workoutLoggerDate";

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, "Home">;

function sourceLabel(source: CalendarWorkout["source"]): string {
  return source === "planned" ? "Planned" : "Completed";
}

export default function WorkoutLoggerScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavigation>();
  const {
    selectedDate,
    setSelectedDate,
    workoutDates,
    workoutsForSelectedDate,
    routineTemplates,
    ensureWorkout,
    startRoutineWorkout,
    startWorkoutFromCalendarEntry,
  } = useWorkoutLogger();

  const [monthDate, setMonthDate] = useState<Date>(() => fromDateKey(selectedDate));

  useEffect(() => {
    setMonthDate(fromDateKey(selectedDate));
  }, [selectedDate]);

  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  const openWorkout = (): void => {
    ensureWorkout();
    navigation.navigate("Workout");
  };

  const openCalendar = (): void => {
    navigation.navigate("Calendar");
  };

  const startRoutine = (routineId: string): void => {
    const routine = routineTemplates.find((item) => item.id === routineId);
    if (!routine) {
      return;
    }

    startRoutineWorkout(routine);
    navigation.navigate("Workout");
  };

  const startFromSelectedDate = (entry: CalendarWorkout): void => {
    startWorkoutFromCalendarEntry(entry);
    navigation.navigate("Workout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Training</Text>
          <Text style={styles.heroTitle}>Workout Tracker</Text>
          <Text style={styles.heroBody}>Your calendar, sessions, and exercise flow are now in one place.</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={openWorkout}>
            <Text style={styles.primaryButtonText}>Home to Workout</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openCalendar}>
            <Text style={styles.secondaryButtonText}>Home to Calendar</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calendar</Text>
          <Text style={styles.cardSubtitle}>Calendar stays visible on the main screen.</Text>
          <WorkoutCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            highlightedDates={workoutDates}
            onSelectDate={setSelectedDate}
            onChangeMonth={setMonthDate}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Date</Text>
          <Text style={styles.cardSubtitle}>{selectedDateLabel}</Text>

          {workoutsForSelectedDate.length ? (
            workoutsForSelectedDate.map((entry) => (
              <View key={entry.id} style={styles.workoutItem}>
                <View style={styles.workoutItemCopy}>
                  <Text style={styles.workoutItemTitle}>{entry.title}</Text>
                  <Text style={styles.workoutItemMeta}>
                    {`${sourceLabel(entry.source)} • ${entry.exercises.length} exercises • ~${entry.durationMin} min`}
                  </Text>
                </View>
                <Pressable
                  style={styles.workoutItemAction}
                  onPress={() => startFromSelectedDate(entry)}
                >
                  <Text style={styles.workoutItemActionText}>Start</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No workout linked to this date yet.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Saved Routines</Text>
          {routineTemplates.map((routine) => (
            <View key={routine.id} style={styles.routineItem}>
              <View style={styles.routineCopy}>
                <Text style={styles.routineName}>{routine.name}</Text>
                <Text style={styles.routineMeta}>{`${routine.exercises.length} exercises`}</Text>
              </View>
              <Pressable
                style={styles.routineAction}
                onPress={() => startRoutine(routine.id)}
              >
                <Text style={styles.routineActionText}>Start</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bgDeep,
  },
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
    color: palette.textDim,
    fontSize: typography.tiny,
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(249,246,238,0.36)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
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
  cardSubtitle: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
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
  workoutItemCopy: {
    flex: 1,
  },
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
    borderColor: "rgba(249,246,238,0.32)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  workoutItemActionText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  emptyText: {
    color: palette.textDim,
    fontSize: typography.caption,
  },
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
  routineCopy: {
    flex: 1,
  },
  routineName: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  routineMeta: {
    marginTop: 2,
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  routineAction: {
    minHeight: 40,
    minWidth: 70,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(249,246,238,0.28)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  routineActionText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
});
