import type { ComponentType } from 'react';

type CalendarRuntimeModule = {
  CalendarList?: ComponentType<any>;
};

function resolveCalendarModule(): CalendarRuntimeModule | null {
  try {
    return require('react-native-calendars') as CalendarRuntimeModule;
  } catch {
    return null;
  }
}

const runtimeModule = resolveCalendarModule();

export const hasNativeCalendarList = Boolean(runtimeModule?.CalendarList);

export const CalendarListAdapter = runtimeModule?.CalendarList ?? null;
