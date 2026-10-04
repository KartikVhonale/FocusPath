import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen bg-background text-label flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-background-elevated border-[0.5px] border-border rounded-3xl p-8 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black tracking-tight text-label">
            Something unexpected occurred
          </h2>
          <p className="text-xs tracking-wide text-label-secondary">
            The application encountered a recoverable error. Your study data is safe in the
            database.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-border text-[11px] font-mono text-[#FF3B30] text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="px-5 py-2.5 rounded-2xl bg-accent text-white font-bold text-xs tracking-wide flex items-center gap-2 hover:bg-accent/90 shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="px-5 py-2.5 rounded-2xl bg-background-elevated text-label font-bold text-xs tracking-wide flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 border-[0.5px] border-border transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Focus</span>
          </button>
        </div>
      </div>
    </div>
  );
}

