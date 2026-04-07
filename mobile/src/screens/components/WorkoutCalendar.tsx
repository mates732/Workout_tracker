import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette, radius, spacing, typography } from "../../theme/workoutLoggerTheme";
import {
  addMonths,
  buildMonthGrid,
  formatMonthYear,
  toDateKey,
} from "../../utils/workoutLoggerDate";

type WorkoutCalendarProps = {
  monthDate: Date;
  selectedDate: string;
  highlightedDates: string[];
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (monthDate: Date) => void;
};

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function WorkoutCalendar({
  monthDate,
  selectedDate,
  highlightedDates,
  onSelectDate,
  onChangeMonth,
}: WorkoutCalendarProps): React.JSX.Element {
  const cells = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const highlightSet = useMemo(() => new Set(highlightedDates), [highlightedDates]);
  const today = toDateKey(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.monthButton}
          onPress={() => onChangeMonth(addMonths(monthDate, -1))}
        >
          <Text style={styles.monthButtonLabel}>{"<"}</Text>
        </Pressable>

        <Text style={styles.monthLabel}>{formatMonthYear(monthDate)}</Text>

        <Pressable
          style={styles.monthButton}
          onPress={() => onChangeMonth(addMonths(monthDate, 1))}
        >
          <Text style={styles.monthButtonLabel}>{">"}</Text>
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell) {
            return <View key={`empty-${index}`} style={styles.emptyCell} />;
          }

          const isSelected = cell.dateKey === selectedDate;
          const isToday = cell.dateKey === today;
          const hasWorkout = highlightSet.has(cell.dateKey);

          return (
            <Pressable
              key={cell.dateKey}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => onSelectDate(cell.dateKey)}
            >
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>{cell.day}</Text>
              {hasWorkout ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  monthButton: {
    minWidth: 36,
    minHeight: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  monthButtonLabel: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  monthLabel: {
    color: palette.text,
    fontSize: typography.subtitle,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emptyCell: {
    width: "14.2857%",
    aspectRatio: 1,
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayCellSelected: {
    backgroundColor: palette.accentBg,
    borderColor: "rgba(249,246,238,0.34)",
  },
  dayCellToday: {
    borderColor: "rgba(249,246,238,0.55)",
  },
  dayNumber: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  dayNumberSelected: {
    color: palette.text,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.success,
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 6,
    height: 6,
    marginTop: 4,
  },
});
