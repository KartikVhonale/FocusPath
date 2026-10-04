import React, { memo } from 'react';

/**
 * Apple HIG Tactile Button Primitive
 * Features spring interaction physics (active:scale-[0.97]), subtle shadows, and crisp typography
 */
export const AppleButton = memo(function AppleButton({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97]';

  const sizes = {
    sm: 'text-xs tracking-wide px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-3xl',
    icon: 'p-2.5 rounded-2xl',
  };

  const variants = {
    primary:
      'bg-accent text-white hover:brightness-105 active:brightness-95 shadow-sm shadow-accent/20 focus-visible:ring-accent',
    secondary:
      'bg-background-elevated text-label border-[0.5px] border-border hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] shadow-sm focus-visible:ring-accent',
    glass:
      'bg-background-elevated/70 hover:bg-background-elevated text-label backdrop-blur-md border-[0.5px] border-border shadow-sm',
    danger:
      'bg-[#FF3B30] hover:bg-[#e0342a] text-white shadow-sm shadow-red-500/20 focus-visible:ring-[#FF3B30]',
    ghost:
      'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-label-secondary hover:text-label',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />}
      {children}
    </button>
  );
});

export default AppleButton;

