import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Apple HIG Global Suspense Loader
 * Provides an instantaneous, fluid loading fallback with subtle breathing glow
 */
export const GlobalLoader = memo(function GlobalLoader({ message = 'Loading workspace...' }) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center">
        {/* Soft breathing radial background glow */}
        <div className="absolute w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Apple HIG Ring Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
          className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary"
        />
      </div>

      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
        className="mt-4 text-xs tracking-wide font-semibold tracking-wide text-text-muted dark:text-text-darkMuted"
      >
        {message}
      </motion.p>
    </div>
  );
});

export default GlobalLoader;


