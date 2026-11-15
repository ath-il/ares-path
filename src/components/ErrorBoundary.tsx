import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ARES PATH error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-ap-bg p-8">
          <div className="ap-panel max-w-xl p-8 text-center">
            <div className="ap-font-display text-lg tracking-[0.22em] text-ap-text">ARES PATH</div>
            <h2 className="mt-4 text-xl text-ap-text">SIGNAL LOST</h2>
            <p className="mt-3 text-xs leading-relaxed text-ap-text-dim">
              The exploration interface encountered an unexpected error. All systems that could not be recovered have
              been safed.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded border border-ap-orange/60 bg-ap-orange/10 px-6 py-2 font-mono text-[10px] tracking-[0.25em] text-ap-orange"
            >
              RECOVER INTERFACE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
