import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  suffix?: string;
}

/**
 * Input — Champ de saisie Netix SIRH 2026
 * Style moderne : Rayon 12px (rounded-xl), halo au focus, ombre feutrée.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      suffix,
      id,
      disabled,
      required,
      type = "text",
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-slate-700 flex items-center justify-between uppercase tracking-wider"
          >
            <span>
              {label}
              {required && <span className="text-rose-600 ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            className={cn(
              "w-full h-10 px-3.5 py-2 text-sm bg-white text-slate-900 border rounded-xl transition-all duration-150 shadow-2xs",
              "placeholder:text-slate-400",
              "focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10",
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed",
              error
                ? "border-rose-400 focus:border-rose-600 focus:ring-rose-500/10"
                : "border-slate-200 hover:border-slate-300",
              leftIcon && "pl-10",
              (rightIcon || suffix) && "pr-12",
              type === "number" && "tabular-nums",
              className
            )}
            {...props}
          />

          {suffix && !rightIcon && (
            <div className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none select-none">
              {suffix}
            </div>
          )}

          {rightIcon && (
            <div className="absolute right-3.5 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
