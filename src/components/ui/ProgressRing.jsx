import React, { memo } from 'react';

/**
 * High-performance Apple HIG Progress Ring
 * Pure SVG implementation with spring animation and zero layout thrashing
 */
export const ProgressRing = memo(function ProgressRing({
  progress = 0, // 0 to 100
  size = 64,
  strokeWidth = 6,
  strokeColor = '#FF6B6B',
  trackColor = 'currentColor',
  trackOpacity = 0.1,
  showValue = false,
  valueText,
  children,
  className = '',
}) {
  const normalizedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 transform"
        style={{ transformOrigin: '50% 50%' }}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeOpacity={trackOpacity}
          fill="transparent"
        />

        {/* Dynamic Progress Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* Central Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {children ? (
          children
        ) : showValue ? (
          <span className="text-xs tracking-wide font-bold tracking-tight">
            {valueText !== undefined ? valueText : `${Math.round(normalizedProgress)}%`}
          </span>
        ) : null}
      </div>
    </div>
  );
});

export default ProgressRing;

