import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4">
          <div className="max-w-md w-full bg-[var(--surf)] border border-[var(--b2)] rounded-2xl p-6 text-center shadow-xl">
            <div className="w-16 h-16 bg-[var(--red-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-[var(--red-tx)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--tx)] mb-2">Something went wrong</h1>
            <p className="text-[13px] text-[var(--tx3)] mb-6">
              An unexpected error occurred in the application. Our team has been notified.
            </p>
            <div className="bg-[var(--surf2)] rounded-lg p-3 text-left mb-6 overflow-auto max-h-32 text-[11px] text-[var(--red-tx)] font-mono whitespace-pre-wrap">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--blue)] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              <RefreshCcw size={16} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
