import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({ className, label, error, helperText, ...props }, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-lg border border-border bg-background-elevated px-4 py-2 text-sm text-text-primary transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand",
          "placeholder:text-text-muted",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-danger focus:ring-danger/50 focus:border-danger",
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <p className={cn("text-xs", error ? "text-danger" : "text-text-muted")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});
Input.displayName = "Input";

export default Input;
