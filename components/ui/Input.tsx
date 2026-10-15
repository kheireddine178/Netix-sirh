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
 * Input — Champ de saisie Netix SIRH
 * Règle §3.4 : Rayon 8px, bordure fine #E2E8F0, focus ring Indigo.
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
            className="text-xs font-semibold text-[#0F172A] flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-[#DC2626] ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#64748B] pointer-events-none flex items-center justify-center">
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
              "w-full h-10 px-3 py-2 text-sm bg-white text-[#0F172A] border rounded-lg transition-all duration-150",
              "placeholder:text-[#94A3B8]",
              "focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]",
              "disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:border-[#E2E8F0] disabled:cursor-not-allowed",
              error
                ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#FEF2F2]"
                : "border-[#E2E8F0] hover:border-[#CBD5E1]",
              leftIcon && "pl-9",
              (rightIcon || suffix) && "pr-12",
              type === "number" && "tabular-nums",
              className
            )}
            {...props}
          />

          {suffix && !rightIcon && (
            <div className="absolute right-3 text-xs font-medium text-[#64748B] pointer-events-none select-none">
              {suffix}
            </div>
          )}

          {rightIcon && (
            <div className="absolute right-3 text-[#64748B] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#DC2626] flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#64748B] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
