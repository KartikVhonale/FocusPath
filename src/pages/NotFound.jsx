import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-main dark:text-text-darkMain flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
        className="max-w-md w-full bg-surface-light dark:bg-surface-dark border border-black/10 dark:border-white/10 rounded-3xl p-8 shadow-apple dark:shadow-apple-dark space-y-6"
      >
        {/* Animated Compass Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-accent text-white flex items-center justify-center shadow-sm">
            <Compass className="w-8 h-8 animate-[spin_12s_linear_infinite]" />
          </div>
        </div>

        {/* 404 Typography */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Error 404
          </span>
          <h1 className="text-2xl tracking-tight font-black text-text-main dark:text-text-darkMain tracking-tight">
            Off the Study Path
          </h1>
          <p className="text-xs tracking-wide text-text-muted leading-relaxed max-w-xs mx-auto">
            The page you're looking for doesn't exist or has moved. Return to your daily focus and
            stay on track with your goals.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            onClick={() => hapticFeedback.tap()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-primary-hover shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Go to Focus</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              window.history.back();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-main dark:text-text-darkMain font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}


