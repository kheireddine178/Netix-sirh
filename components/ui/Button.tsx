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
      // Primary: Indigo profond avec highlight lumineux supérieur
      primary:
        "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 focus-visible:ring-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(79,70,229,0.25)] [&_*]:text-white",
      // Secondary: Fond blanc, contour doux, ombre feutrée
      secondary:
        "bg-white border border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus-visible:ring-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      // Ghost: Subtil
      ghost:
        "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-300",
      // Danger: Action destructive
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(225,29,72,0.25)] [&_*]:text-white",
      // Danger Outline
      "danger-outline":
        "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100 focus-visible:ring-rose-500",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 sm:h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
      lg: "h-11 sm:h-12 px-6 text-sm sm:text-base rounded-xl gap-2.5",
      icon: "h-9 w-9 p-0 rounded-xl justify-center",
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
