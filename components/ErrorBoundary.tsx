'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логуємо помилку для моніторингу
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-surface p-8">
            <div className="max-w-md w-full bg-surface-secondary rounded-2xl border border-subtle p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Щось пішло не так</h2>
                <p className="text-muted-foreground">
                  Вибачте за незручності. Сталася неочікувана помилка.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-surface rounded-lg p-4 text-left">
                  <p className="text-xs font-mono text-red-500 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium">
                  Спробувати ще раз
                </button>
                <button
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  className="px-6 py-3 border border-subtle bg-surface text-foreground rounded-lg hover:bg-surface-secondary transition-colors font-medium">
                  На головну
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

