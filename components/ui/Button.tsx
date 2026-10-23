import React, { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  href?: string;
  asChild?: boolean;
}

/**
 * Button — Composant bouton Netix SIRH 2026
 * Style tactile moderne, biseau supérieur lumineux, micro-interaction au clic.
 */
export const Button = forwardRef<any, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      children,
      type = "button",
      href,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98] no-underline";

    const variantStyles = {
      // Primary: Émeraude Institutionnelle (Proposition 1)
      primary:
        "bg-[#0D3B2E] text-white hover:bg-[#092B21] active:bg-[#062018] focus-visible:ring-[#0D3B2E] shadow-2xs [&_*]:text-white",
      // Secondary: Fond blanc, contour doux, ombre feutrée
      secondary:
        "bg-white border border-[#E4E4E7] text-[#111827] hover:bg-[#FAF9F8] hover:border-[#D4D4D8] active:bg-[#F4F4F5] focus-visible:ring-[#0D3B2E]/20 shadow-2xs",
      // Ghost: Subtil
      ghost:
        "bg-transparent text-[#52525B] hover:text-[#111827] hover:bg-[#F4F4F5] active:bg-[#E4E4E7] focus-visible:ring-[#0D3B2E]/20",
      // Danger: Action destructive
      danger:
        "bg-[#991B1B] text-white hover:bg-[#7F1D1D] active:bg-[#581313] focus-visible:ring-[#991B1B] shadow-2xs [&_*]:text-white",
      // Danger Outline
      "danger-outline":
        "bg-white border border-[#FECACA] text-[#991B1B] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] active:bg-[#FEE2E2] focus-visible:ring-[#991B1B]/20",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
      md: "h-9 px-3.5 text-xs font-semibold rounded-lg gap-2",
      lg: "h-10 px-5 text-sm font-semibold rounded-lg gap-2.5",
      icon: "h-8 w-8 p-0 rounded-lg justify-center",
    };

    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
    const isDisabled = disabled || loading;

    const content = (
      <>
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />}
        {!loading && icon && iconPosition === "left" && (
          <span className="shrink-0 text-current">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0 text-current">{icon}</span>
        )}
      </>
    );

    if (href && !isDisabled) {
      return (
        <Link href={href} className={combinedClassName}>
          {content}
        </Link>
      );
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(combinedClassName, (children as React.ReactElement<any>).props.className),
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={combinedClassName}
        {...props}
      >
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";
