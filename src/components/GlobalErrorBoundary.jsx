import React, { Component } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { logClientError } from '../services/telemetry';

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Dispatch error to backend telemetry
    logClientError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-background text-label flex items-center justify-center p-6 antialiased selection:bg-accent/20">
          <div className="max-w-md w-full backdrop-blur-2xl bg-background-elevated border-[0.5px] border-border rounded-3xl p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" strokeWidth={2} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-label">Something went wrong</h2>
              <p className="text-sm font-medium text-label-secondary">
                Don't worry, your study progress is safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-border text-[11px] font-mono text-[#FF3B30] text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-5 rounded-2xl bg-accent hover:bg-accent/90 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
