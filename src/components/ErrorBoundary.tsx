import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WhatsAppSupportNote } from '@/components/WhatsAppSupportNote';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-muted-foreground">
                We apologize for the inconvenience. Please try again or return to the homepage.
              </p>
            </div>

            {this.state.error && (
              <div className="mb-4 p-4 bg-muted rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <WhatsAppSupportNote
              kind="error"
              errorText={this.state.error?.message}
              className="mb-6 text-left"
            />

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional component wrapper for specific error fallbacks
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({ 
  error, 
  resetError,
  title = "Error Loading Content",
  message = "There was a problem loading this content. Please try again."
}: ErrorFallbackProps) {
  return (
    <Card className="p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{message}</p>
      <WhatsAppSupportNote kind="error" errorText={error?.message} className="mb-4 text-left" />
      {resetError && (
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </Card>
  );
}
