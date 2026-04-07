import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  type CalendarWorkout,
  useWorkoutLogger,
} from "../state/WorkoutLoggerContext";
import { palette, radius, spacing, typography } from "../theme/workoutLoggerTheme";
import { formatDateLabel, fromDateKey } from "../utils/workoutLoggerDate";
import WorkoutCalendar from "./components/WorkoutCalendar";

type CalendarNavigation = NativeStackNavigationProp<RootStackParamList, "Calendar">;

function sourceLabel(source: CalendarWorkout["source"]): string {
  return source === "planned" ? "Planned" : "Completed";
}

export default function CalendarScreen(): React.JSX.Element {
  const navigation = useNavigation<CalendarNavigation>();
  const {
    selectedDate,
    setSelectedDate,
    workoutDates,
    workoutsForSelectedDate,
    startWorkoutFromCalendarEntry,
  } = useWorkoutLogger();

  const [monthDate, setMonthDate] = useState<Date>(() => fromDateKey(selectedDate));
  const selectedDateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);

  useEffect(() => {
    setMonthDate(fromDateKey(selectedDate));
  }, [selectedDate]);

  const startFromDate = (entry: CalendarWorkout): void => {
    startWorkoutFromCalendarEntry(entry);
    navigation.navigate("Workout");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <WorkoutCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            highlightedDates={workoutDates}
            onSelectDate={setSelectedDate}
            onChangeMonth={setMonthDate}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Workouts on {selectedDateLabel}</Text>
          {workoutsForSelectedDate.length ? (
            workoutsForSelectedDate.map((entry) => (
              <View key={entry.id} style={styles.itemRow}>
                <View style={styles.itemCopy}>
                  <Text style={styles.itemTitle}>{entry.title}</Text>
                  <Text style={styles.itemMeta}>
                    {`${sourceLabel(entry.source)} • ${entry.exercises.length} exercises • ~${entry.durationMin} min`}
                  </Text>
                </View>
                <Pressable
                  style={styles.itemAction}
                  onPress={() => startFromDate(entry)}
                >
                  <Text style={styles.itemActionText}>Start</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No workouts linked to this date.</Text>
          )}
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
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: palette.text,
    fontSize: typography.title,
    fontWeight: "900",
  },
  closeButton: {
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  closeButtonText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: palette.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
  },
  itemRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  itemCopy: {
    flex: 1,
  },
  itemTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  itemMeta: {
    marginTop: 2,
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  itemAction: {
    minHeight: 40,
    minWidth: 74,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "rgba(249,246,238,0.30)",
    backgroundColor: palette.accentBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  itemActionText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: "800",
  },
  emptyText: {
    color: palette.textDim,
    fontSize: typography.caption,
  },
});
