import React from 'react';
import { Animated } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PropsWithChildren } from 'react';

type AnimatedViewProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export default function AnimatedView({ style, children }: AnimatedViewProps) {
  return <Animated.View style={style}>{children}</Animated.View>;
}
