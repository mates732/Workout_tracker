import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme/tokens';

type CalendarComponentProps = {
  selectedDate: string;
  workoutDates: string[];
  onSelectDate: (nextDate: string) => void;
  weeksToRender?: number;
};

type DayModel = {
  dateKey: string;
  weekday: string;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasWorkout: boolean;
};

type WeekModel = {
  id: string;
  label: string;
  days: DayModel[];
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string): Date {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return new Date();
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const next = new Date(year, month - 1, day);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(base: Date, count: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + count);
  return next;
}

function addWeeks(base: Date, count: number): Date {
  return addDays(base, count * 7);
}

function startOfWeekMonday(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function buildWeeks(
  selectedDate: string,
  workoutDateSet: Set<string>,
  totalWeeks: number,
  todayKey: string
): WeekModel[] {
  const safeWeeks = Math.max(3, totalWeeks % 2 === 0 ? totalWeeks + 1 : totalWeeks);
  const centerWeek = Math.floor(safeWeeks / 2);
  const selectedBase = startOfWeekMonday(parseDateKey(selectedDate));

  return Array.from({ length: safeWeeks }, (_, index) => {
    const weekOffset = index - centerWeek;
    const weekStart = addWeeks(selectedBase, weekOffset);
    const weekEnd = addDays(weekStart, 6);

    const label = `${weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

    const days = Array.from({ length: 7 }, (__unused, dayIndex) => {
      const date = addDays(weekStart, dayIndex);
      const dateKey = toDateKey(date);

      return {
        dateKey,
        weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
        day: date.getDate(),
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDate,
        hasWorkout: workoutDateSet.has(dateKey),
      };
    });

    return {
      id: `${toDateKey(weekStart)}-${index}`,
      label,
      days,
    };
  });
}

export function CalendarComponent({
  selectedDate,
  workoutDates,
  onSelectDate,
  weeksToRender = 11,
}: CalendarComponentProps) {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const weekPagerRef = useRef<FlatList<WeekModel> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const [pageWidth, setPageWidth] = useState(0);

  const workoutDateSet = useMemo(() => {
    return new Set(workoutDates.map((date) => toDateKey(parseDateKey(date))));
  }, [workoutDates]);

  const weeks = useMemo(
    () => buildWeeks(selectedDate, workoutDateSet, weeksToRender, todayKey),
    [selectedDate, todayKey, weeksToRender, workoutDateSet]
  );

  const selectedWeekIndex = useMemo(() => Math.floor(weeks.length / 2), [weeks.length]);

  useEffect(() => {
    pulse.setValue(0.9);
    Animated.spring(pulse, {
      toValue: 1,
      bounciness: 7,
      speed: 18,
      useNativeDriver: true,
    }).start();
  }, [pulse, selectedDate]);

  useEffect(() => {
    if (!weekPagerRef.current || selectedWeekIndex < 0) {
      return;
    }

    weekPagerRef.current.scrollToIndex({
      index: selectedWeekIndex,
      animated: false,
    });
  }, [selectedWeekIndex]);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.max(1, Math.round(event.nativeEvent.layout.width));
    setPageWidth(nextWidth);
  };

  const renderWeek = ({ item }: { item: WeekModel }) => {
    return (
      <View style={[styles.weekPage, { width: pageWidth || undefined }]}> 
        <Text style={styles.weekLabel}>{item.label}</Text>
        <View style={styles.daysRow}>
          {item.days.map((day) => {
            const dayCircle = (
              <View
                style={[
                  styles.dayCircle,
                  day.isToday && styles.dayCircleToday,
                  day.isSelected && styles.dayCircleSelected,
                ]}
              >
                <Text style={[styles.dayNumber, day.isSelected && styles.dayNumberSelected]}>{day.day}</Text>
              </View>
            );

            return (
              <Pressable
                key={day.dateKey}
                style={styles.dayItem}
                onPress={() => onSelectDate(day.dateKey)}
                accessibilityRole="button"
                accessibilityLabel={`${day.weekday} ${day.day}`}
              >
                <Text style={styles.dayWeekday}>{day.weekday.slice(0, 3)}</Text>
                {day.isSelected ? (
                  <Animated.View style={{ transform: [{ scale: pulse }] }}>{dayCircle}</Animated.View>
                ) : (
                  dayCircle
                )}
                <View style={styles.dotWrap}>
                  {day.hasWorkout ? <View style={styles.workoutDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <FlatList
        ref={weekPagerRef}
        data={weeks}
        horizontal
        pagingEnabled
        snapToAlignment="center"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        initialScrollIndex={selectedWeekIndex}
        getItemLayout={(_, index) => {
          const width = pageWidth || 320;
          return {
            length: width,
            offset: width * index,
            index,
          };
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekPage: {
    gap: spacing.sm,
  },
  weekLabel: {
    color: colors.mutedText,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayWeekday: {
    color: colors.mutedText,
    fontSize: typography.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderColor: colors.primary,
  },
  dayCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dayNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: colors.primaryText,
  },
  dotWrap: {
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});
