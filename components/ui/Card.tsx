import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

/**
 * Card — Composant carte Netix SIRH 2026
 * Style : Rayon 16px (rounded-2xl), bordures fines découpées, ombrage diffus aérien.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_16px_-4px_rgba(15,23,42,0.03)]",
        hoverable &&
          "transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)] hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-bold leading-tight text-slate-900 tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-xs text-slate-500 leading-relaxed", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6 pt-0 border-t border-slate-100 mt-4 pt-4", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
