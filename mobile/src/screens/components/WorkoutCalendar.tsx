import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DayInfo, SplitType } from "../../state/WorkoutLoggerContext";
import { palette, radius, spacing, splitColors, todayColor, typography } from "../../theme/workoutLoggerTheme";
import { addMonths, buildMonthGrid, formatMonthYear, toDateKey } from "../../utils/workoutLoggerDate";

type WorkoutCalendarProps = {
  monthDate: Date;
  selectedDate: string;
  calendarDays: Record<string, DayInfo>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (monthDate: Date) => void;
};

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getSplitDotColor(split: SplitType, status: "future" | "completed" | "missed" | "sick"): string {
  if (status === "future") return splitColors[split].bright;
  if (status === "completed") return splitColors[split].dark;
  return "rgba(255,255,255,0.15)"; // missed / sick
}

export default function WorkoutCalendar({
  monthDate,
  selectedDate,
  calendarDays,
  onSelectDate,
  onChangeMonth,
}: WorkoutCalendarProps): React.JSX.Element {
  const cells = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const today = toDateKey(new Date());

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.headerRow}>
        <Pressable style={styles.monthButton} onPress={() => onChangeMonth(addMonths(monthDate, -1))}>
          <Text style={styles.monthButtonLabel}>{"‹"}</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthYear(monthDate)}</Text>
        <Pressable style={styles.monthButton} onPress={() => onChangeMonth(addMonths(monthDate, 1))}>
          <Text style={styles.monthButtonLabel}>{"›"}</Text>
        </Pressable>
      </View>

      {/* Week day header */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((day, i) => (
          <Text key={`wd-${i}`} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell) return <View key={`empty-${index}`} style={styles.emptyCell} />;

          const isToday = cell.dateKey === today;
          const isSelected = cell.dateKey === selectedDate;
          const dayInfo = calendarDays[cell.dateKey];

          return (
            <Pressable
              key={cell.dateKey}
              style={[styles.dayCell, isSelected && !isToday && styles.dayCellSelected]}
              onPress={() => onSelectDate(cell.dateKey)}
            >
              {/* Date number with today indicator */}
              <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    !isToday && isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {cell.day}
                </Text>
              </View>

              {/* Split color dot */}
              {dayInfo ? (
                <View
                  style={[
                    styles.splitDot,
                    { backgroundColor: getSplitDotColor(dayInfo.split, dayInfo.status) },
                    dayInfo.status === "completed" && styles.splitDotCompleted,
                  ]}
                />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {(["push", "pull", "legs"] as SplitType[]).map((split) => (
          <View key={split} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: splitColors[split].bright }]} />
            <Text style={styles.legendLabel}>{split.charAt(0).toUpperCase() + split.slice(1)}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: splitColors.legs.dark }]} />
          <Text style={styles.legendLabel}>Done</Text>
        </View>
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
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  monthButtonLabel: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
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
    textTransform: "uppercase",
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
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 2,
  },
  dayCellSelected: {
    borderColor: "rgba(124,106,245,0.40)",
    backgroundColor: "rgba(124,106,245,0.10)",
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleToday: {
    backgroundColor: todayColor,
  },
  dayNumber: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  dayNumberToday: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dayNumberSelected: {
    color: palette.text,
    fontWeight: "800",
  },
  splitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitDotCompleted: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotPlaceholder: {
    width: 6,
    height: 6,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: palette.textDim,
    fontSize: typography.tiny,
    fontWeight: "600",
  },
});
