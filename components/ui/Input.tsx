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
            className="text-[11px] font-semibold text-[#71717A] flex items-center justify-between uppercase tracking-wider"
          >
            <span>
              {label}
              {required && <span className="text-[#991B1B] ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#A1A1AA] pointer-events-none flex items-center justify-center">
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
              "w-full h-9 px-3 py-1.5 text-xs bg-white text-[#111827] border rounded-lg transition-all duration-150 shadow-2xs",
              "placeholder:text-[#A1A1AA]",
              "focus:outline-none focus:border-[#0D3B2E] focus:ring-1 focus:ring-[#0D3B2E]/20",
              "disabled:bg-[#FAF9F8] disabled:text-[#A1A1AA] disabled:border-[#E4E4E7] disabled:cursor-not-allowed",
              error
                ? "border-[#FECACA] focus:border-[#991B1B] focus:ring-[#991B1B]/20"
                : "border-[#E4E4E7] hover:border-[#D4D4D8]",
              leftIcon && "pl-9",
              (rightIcon || suffix) && "pr-10",
              type === "number" && "tabular-nums",
              className
            )}
            {...props}
          />

          {suffix && !rightIcon && (
            <div className="absolute right-3 text-xs font-bold text-[#A1A1AA] pointer-events-none select-none">
              {suffix}
            </div>
          )}

          {rightIcon && (
            <div className="absolute right-3 text-[#A1A1AA] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-[#991B1B] flex items-center gap-1 mt-0.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-[#71717A] mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
