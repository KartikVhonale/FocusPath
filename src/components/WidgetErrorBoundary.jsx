import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RotateCcw } from 'lucide-react';

function WidgetFallback({ error, resetErrorBoundary, title = 'Widget' }) {
  return (
    <div className="bg-background-elevated border-[0.5px] border-border rounded-3xl p-6 shadow-sm text-center space-y-3 flex flex-col items-center justify-center min-h-[180px]">
      <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/10 text-label flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs tracking-wide font-bold text-label">Unable to load {title}</h4>
        <p className="text-[11px] text-label-secondary max-w-xs mx-auto">
          An error prevented this component from rendering cleanly. The rest of your app remains
          active.
        </p>
      </div>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-xs tracking-wide font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}

export default function WidgetErrorBoundary({ children, title = 'Widget' }) {
  return (
    <ErrorBoundary FallbackComponent={(props) => <WidgetFallback {...props} title={title} />}>
      {children}
    </ErrorBoundary>
  );
}

