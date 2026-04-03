import './src/polyfills/performance';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import type { RootStackParamList } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/ErrorBoundary';
import { MinimizedWorkoutBar } from './src/features/workout/MinimizedWorkoutBar';
import { WorkoutFlowProvider } from './src/shared/state/WorkoutFlowContext';
import React, { useEffect, useRef, useState } from 'react';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppShell() {
  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <RootNavigator />
      <MinimizedWorkoutBar
        onPress={() => {
          if (!navigationRef.isReady()) {
            return;
          }
          navigationRef.navigate('ActiveWorkout');
        }}
      />
    </NavigationContainer>
  );
}

export default function App() {
  const screenHeight = Dimensions.get('window').height;

  // Animated values
  const appTranslate = useRef(new Animated.Value(screenHeight)).current; // app starts off-screen
  const overlayTranslate = useRef(new Animated.Value(0)).current; // overlay moves up to hide
  const logoTranslate = useRef(new Animated.Value(0)).current; // logo moves up slightly
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Animate logo up and app slide in from bottom; remove overlay after animation
      Animated.parallel([
        Animated.timing(logoTranslate, {
          toValue: -48,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(appTranslate, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayTranslate, {
          toValue: -screenHeight - 40,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hide splash overlay after animation completes
        setSplashVisible(false);
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [appTranslate, logoTranslate, overlayTranslate, screenHeight]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <WorkoutFlowProvider>
            {/* App content mounted but translated off-screen until animation */}
            <Animated.View style={[styles.root, { transform: [{ translateY: appTranslate }] }]}> 
              <AppShell />
            </Animated.View>
          </WorkoutFlowProvider>
        </SafeAreaProvider>
          {/* Splash overlay rendered here as a sibling to SafeAreaProvider so it sits above all app UI */}
          {splashVisible ? (
            <Animated.View
              pointerEvents="auto"
              style={[
                styles.splashOverlay,
                { transform: [{ translateY: overlayTranslate }] },
              ]}
            >
              <Animated.Text
                style={[
                  styles.splashText,
                  { transform: [{ translateY: logoTranslate }] },
                ]}
              >
                VPULZ
              </Animated.Text>
            </Animated.View>
          ) : null}

      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    elevation: 200,
  },
  splashText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    // subtle glow
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    includeFontPadding: false,
  },
});
