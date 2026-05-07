import { Component, ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: unknown) {
    console.error('ErrorBoundary', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-4xl mb-4">⚠</div>
            <div className="font-display text-lg font-bold mb-2">Something went wrong</div>
            <div className="text-sm text-t3 font-mono mb-4">{this.state.error.message}</div>
            <button
              className="gradient-sky text-primary-foreground rounded-lg px-5 py-2.5 font-display text-sm font-bold"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
