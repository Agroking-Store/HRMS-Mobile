import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected error occurred.',
    };
  }

  private handleRestart = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
    });
  };

  render() {
    const { hasError, errorMessage } = this.state;
    if (hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.appName}>HRMS Mobile</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{errorMessage}</Text>
          <Pressable style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Restart</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
    gap: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#01696f',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    backgroundColor: '#01696f',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
