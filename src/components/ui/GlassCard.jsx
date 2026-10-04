import React, { memo } from 'react';

/**
 * Apple HIG Glassmorphic Surface Card
 * True frosted glass surface with spring hover physics and subtle borders
 */
export const GlassCard = memo(function GlassCard({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  onClick,
  ...props
}) {
  const baseStyles = 'rounded-3xl transition-all duration-300 backdrop-blur-xl';

  const variants = {
    default: 'bg-background-elevated/70 border-[0.5px] border-border shadow-sm',
    elevated: 'bg-background-elevated border-[0.5px] border-border shadow-sm',
    subtle: 'bg-background-elevated/40 border-[0.5px] border-border',
    floating: 'bg-background-elevated/90 border-[0.5px] border-border shadow-sm backdrop-blur-2xl',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.default} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export default GlassCard;
