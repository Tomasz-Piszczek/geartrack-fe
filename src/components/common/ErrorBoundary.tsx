import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  retryCount: number;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silently retry rendering (handles browser extension DOM conflicts)
    if (this.state.retryCount < 3) {
      this.setState(prev => ({
        hasError: false,
        retryCount: prev.retryCount + 1,
      }));
    } else {
      // After 3 retries, reload as last resort
      window.location.reload();
    }
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;
