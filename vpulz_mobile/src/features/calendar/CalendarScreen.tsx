import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useWorkoutStore, formatDuration } from '../../store/workoutStore';
import { colors, radius, spacing, typography } from '../../shared/theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function pad(v: number): string {
  return String(v).padStart(2, '0');
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const history = useWorkoutStore((s) => s.history);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Build lookup of history entries by date
  const historyByDate = useMemo(() => {
    const map = new Map<string, typeof history>();
    history.forEach((entry) => {
      const d = new Date(entry.completedAt);
      const key = toDateKey(d);
      const existing = map.get(key) ?? [];
      existing.push(entry);
      map.set(key, existing);
    });
    return map;
  }, [history]);

  const workoutDates = useMemo(() => new Set(historyByDate.keys()), [historyByDate]);

  // Calendar grid
  const monthDays = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  // Leading empty cells (Monday=0 start)
  const firstDayOfWeek = useMemo(() => {
    const d = monthDays[0]?.getDay() ?? 1;
    return d === 0 ? 6 : d - 1; // Convert Sunday=0 to Monday-start index
  }, [monthDays]);

  const selectedEntries = useMemo(
    () => historyByDate.get(selectedDate) ?? [],
    [historyByDate, selectedDate],
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Calendar</Text>
        </View>

        {/* Month nav */}
        <View style={styles.monthNav}>
          <Pressable onPress={goToPrevMonth} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>{getMonthLabel(viewYear, viewMonth)}</Text>
          <Pressable onPress={goToNextMonth} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>›</Text>
          </Pressable>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekdayText}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {monthDays.map((date) => {
            const key = toDateKey(date);
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const hasWorkout = workoutDates.has(key);

            return (
              <Pressable
                key={key}
                style={styles.dayCell}
                onPress={() => setSelectedDate(key)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && !isSelected && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                {hasWorkout && <View style={styles.workoutDot} />}
              </Pressable>
            );
          })}
        </View>

        {/* Selected day detail */}
        <View style={styles.selectedSection}>
          <Text style={styles.selectedDateLabel}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {selectedEntries.length === 0 ? (
            <View style={styles.noWorkoutCard}>
              <Text style={styles.noWorkoutText}>No workouts on this day</Text>
            </View>
          ) : (
            selectedEntries.map((entry) => (
              <View key={entry.id} style={styles.workoutCard}>
                <View style={styles.workoutCardHeader}>
                  <Text style={styles.workoutCardName}>{entry.workoutName}</Text>
                  <View style={styles.splitBadge}>
                    <Text style={styles.splitBadgeText}>
                      {entry.split.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.workoutCardStats}>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>
                      {Math.round(entry.durationSec / 60)}
                    </Text>
                    <Text style={styles.miniStatLabel}>min</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{entry.exerciseCount}</Text>
                    <Text style={styles.miniStatLabel}>exercises</Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Text style={styles.miniStatValue}>{entry.setCount}</Text>
                    <Text style={styles.miniStatLabel}>sets</Text>
                  </View>
                </View>
                <Text style={styles.workoutTime}>
                  {new Date(entry.completedAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '800',
    flex: 1,
  },

  // Month navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  monthLabel: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '700',
  },

  // Weekday row
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.primary + '66',
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  workoutDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  // Selected day
  selectedSection: {
    gap: spacing.sm,
  },
  selectedDateLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  noWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noWorkoutText: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutCardName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '700',
    flex: 1,
  },
  splitBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primary + '18',
  },
  splitBadgeText: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  workoutCardStats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  miniStat: {
    alignItems: 'center',
    gap: 2,
  },
  miniStatValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  miniStatLabel: {
    color: colors.mutedText,
    fontSize: typography.tiny,
  },
  workoutTime: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
});
