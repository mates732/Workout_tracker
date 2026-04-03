import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unknown runtime error';
    return {
      hasError: true,
      message,
    };
  }

  componentDidCatch(error: unknown) {
    if (error instanceof Error) {
      console.error('[ErrorBoundary]', error.message);
      return;
    }
    console.error('[ErrorBoundary] Unknown runtime error');
  }

  private resetBoundary = () => {
    this.setState({
      hasError: false,
      message: '',
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        <Text style={styles.title}>App Runtime Error</Text>
        <Text style={styles.message}>{this.state.message || 'Unexpected error occurred.'}</Text>
        <Text style={styles.helper}>Reload the app. If the issue persists, share this message.</Text>
        <Pressable style={styles.button} onPress={this.resetBoundary}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
