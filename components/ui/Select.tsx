import React, { forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: Option[];
}

/**
 * Select — Sélecteur de liste déroulante Netix SIRH
 * Règle : Chevron Lucide React exclusif, bordure fine #E2E8F0.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      options,
      children,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[#0F172A] flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-[#DC2626] ml-1">*</span>}
            </span>
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              "w-full h-10 pl-3 pr-9 py-2 text-sm bg-white text-[#0F172A] border rounded-lg appearance-none transition-all duration-150 cursor-pointer",
              "focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#EEF2FF]",
              "disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:border-[#E2E8F0] disabled:cursor-not-allowed",
              error
                ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#FEF2F2]"
                : "border-[#E2E8F0] hover:border-[#CBD5E1]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute right-3 text-[#64748B] pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
          </div>
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

Select.displayName = "Select";
