/**
 * Screen Error Boundary Component
 * Wraps individual screens to catch and handle errors gracefully
 * 
 * Features:
 * - Catches React component errors
 * - Shows user-friendly error message
 * - Provides retry functionality
 * - Logs errors for debugging
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  screenName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[${this.props.screenName || 'Screen'}] Error caught:`, error);
    console.error("Component stack:", errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ThemedView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <ThemedText style={styles.icon}>:(</ThemedText>
            </View>
            
            <ThemedText style={styles.title}>Something went wrong</ThemedText>
            
            <ThemedText style={styles.message}>
              {this.props.screenName 
                ? `The ${this.props.screenName} screen encountered an error.`
                : "This screen encountered an error."}
            </ThemedText>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <ThemedText style={styles.debugTitle}>Debug Info:</ThemedText>
                <ThemedText style={styles.debugText}>
                  {this.state.error.message}
                </ThemedText>
              </View>
            )}
            
            <Pressable style={styles.retryButton} onPress={this.handleRetry}>
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
            
            <ThemedText style={styles.helpText}>
              If this keeps happening, try closing and reopening the app.
            </ThemedText>
          </ScrollView>
        </ThemedView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.errorLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 32,
    color: Colors.light.error,
  },
  title: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.size.md,
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
  },
  debugContainer: {
    backgroundColor: Colors.light.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
    width: "100%",
  },
  debugTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  debugText: {
    fontSize: Typography.size.xs,
    fontFamily: "monospace",
    color: Colors.light.error,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  helpText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
    color: Colors.light.textTertiary,
  },
});

export default ScreenErrorBoundary;
