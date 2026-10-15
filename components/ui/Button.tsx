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
 * Button — Composant bouton standard Netix SIRH
 * Règle §3.2 : UN seul bouton principal (Indigo #4F46E5) par écran.
 * Supporte `href` pour créer directement un lien avec le style exact de bouton.
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
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer no-underline";

    const variantStyles = {
      // Primary: Indigo #4F46E5 (Action principale unique) - Texte BLANC garanti (#ffffff)
      primary:
        "bg-[#4F46E5] text-white hover:bg-[#4338CA] active:bg-[#3730A3] focus-visible:ring-[#4F46E5] shadow-[0_1px_2px_rgba(79,70,229,0.15)] [&_*]:text-white",
      // Secondary: Contour neutre, fond blanc
      secondary:
        "bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:bg-[#F1F5F9] focus-visible:ring-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
      // Ghost: Fond transparent
      ghost:
        "bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] focus-visible:ring-slate-400",
      // Danger: Actions destructives directes
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus-visible:ring-[#DC2626] shadow-[0_1px_2px_rgba(220,38,38,0.15)] [&_*]:text-white",
      // Danger Outline: Avertissement discret
      "danger-outline":
        "bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] active:bg-[#FEE2E2] focus-visible:ring-[#DC2626]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-10 px-4 text-sm rounded-lg gap-2",
      lg: "h-12 px-6 text-base rounded-lg gap-2.5",
      icon: "h-9 w-9 p-0 rounded-lg justify-center",
    };

    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
    const isDisabled = disabled || loading;

    const content = (
      <>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" strokeWidth={2} />
        ) : (
          icon && iconPosition === "left" && <span className="inline-flex shrink-0">{icon}</span>
        )}
        {children && (
          <span className="inline-flex items-center gap-1.5 [&_a]:text-inherit [&_a]:hover:text-inherit">
            {children}
          </span>
        )}
        {!loading && icon && iconPosition === "right" && (
          <span className="inline-flex shrink-0">{icon}</span>
        )}
      </>
    );

    // Si `href` est fourni, on rend directement un composant Next Link
    if (href) {
      return (
        <Link
          ref={ref}
          href={href}
          className={combinedClassName}
          {...(props as any)}
        >
          {content}
        </Link>
      );
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
