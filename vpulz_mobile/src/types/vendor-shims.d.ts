declare module 'react-native-calendars' {
  import * as React from 'react';

  export type DateData = {
    year: number;
    month: number;
    day: number;
    timestamp: number;
    dateString: string;
  };

  export const CalendarList: React.ComponentType<any>;
}

declare module '@gorhom/bottom-sheet' {
  import * as React from 'react';

  export class BottomSheetModal extends React.Component<any> {
    present: () => void;
    dismiss: () => void;
  }

  export const BottomSheetModalProvider: React.ComponentType<React.PropsWithChildren>;
  export const BottomSheetScrollView: React.ComponentType<any>;
}
