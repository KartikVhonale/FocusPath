import React, { forwardRef, memo } from 'react';

/**
 * Apple HIG Tactile Input Primitive
 * Features subtle frosted glass styling, smooth focus rings, and clear typography
 */
export const AppleInput = memo(
  forwardRef(function AppleInput(
    { label, icon: Icon, error, className = '', wrapperClassName = '', type = 'text', ...props },
    ref
  ) {
    return (
      <div className={`flex flex-col gap-1.5 w-full ${wrapperClassName}`}>
        {label && (
          <label className="text-xs tracking-wide font-semibold text-label-secondary select-none">{label}</label>
        )}
        <div className="relative flex items-center w-full">
          {Icon && (
            <div className="absolute left-3.5 text-label-secondary pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full bg-black/5 dark:bg-white/5 border-[0.5px] border-border rounded-2xl py-2.5 px-3.5 text-sm text-label placeholder:text-label-secondary/60 transition-all duration-200 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
              Icon ? 'pl-10' : ''
            } ${error ? 'border-[#FF3B30] focus:border-[#FF3B30] focus:ring-red-500/20' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-[11px] text-[#FF3B30] font-medium">{error}</span>}
      </div>
    );
  })
);

export default AppleInput;

