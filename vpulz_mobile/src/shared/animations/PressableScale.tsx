import { PropsWithChildren, useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';

type PressableScaleProps = PropsWithChildren<PressableProps>;

export function PressableScale({ children, ...props }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 25,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={(event) => {
          animateTo(0.97);
          props.onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(1);
          props.onPressOut?.(event);
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
