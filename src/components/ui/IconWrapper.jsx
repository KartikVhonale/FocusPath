import React, { memo } from 'react';

/**
 * Standardized Apple HIG Icon Wrapper
 * Enforces uniform 20px size and 2px stroke width with optional rounded pill/badge backgrounds
 */
export const IconWrapper = memo(function IconWrapper({
  icon: Icon,
  size = 20,
  strokeWidth = 2,
  badge = false,
  badgeColor = 'default',
  className = '',
  iconClassName = '',
  ...props
}) {
  if (!Icon) return null;

  const badgeVariants = {
    default: 'bg-background-elevated text-label-secondary border-[0.5px] border-border',
    primary: 'bg-accent/10 text-accent border border-accent/20',
    secondary: 'bg-success/15 text-success border border-success/20',
    blue: 'bg-accent/10 text-accent border border-accent/20',
    amber: 'bg-accent/10 text-accent border border-accent/20',
    green: 'bg-success/10 text-success border border-success/20',
    rose: 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20',
    purple: 'bg-accent/10 text-accent border border-accent/20',
  };

  if (!badge) {
    return (
      <Icon
        size={size}
        strokeWidth={strokeWidth}
        className={`shrink-0 ${iconClassName} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl p-2.5 transition-colors ${
        badgeVariants[badgeColor] || badgeVariants.default
      } ${className}`}
      {...props}
    >
      <Icon size={size} strokeWidth={strokeWidth} className={`shrink-0 ${iconClassName}`} />
    </div>
  );
});

export default IconWrapper;
