"use client";

import React, { Component, ReactNode } from "react";
import ErrorDisplay from "./ErrorDisplay";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          title="Application Error"
          showDetails={true}
          onRetry={this.handleRetry}
          onAuthRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export function withAuthErrorHandling<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithAuthErrorHandling = (props: P) => {
    return (
      <AuthErrorBoundary>
        <WrappedComponent {...props} />
      </AuthErrorBoundary>
    );
  };

  WithAuthErrorHandling.displayName = `withAuthErrorHandling(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAuthErrorHandling;
}