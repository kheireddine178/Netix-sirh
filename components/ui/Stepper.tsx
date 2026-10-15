"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

/**
 * Stepper — Indicateur de progression par étapes Netix SIRH
 * Règle §5.2 : Utilisé pour guider la clôture mensuelle en 5 étapes sans stress.
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <ol className="flex items-center w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isLast = idx === steps.length - 1;
          const isClickable = onStepClick && idx <= currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center relative",
                !isLast && "w-full"
              )}
            >
              <div
                onClick={() => isClickable && onStepClick(idx)}
                className={cn(
                  "flex items-center gap-3 shrink-0",
                  isClickable && "cursor-pointer group"
                )}
              >
                {/* Numéro ou Icône de validation */}
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all shrink-0",
                    isCompleted
                      ? "bg-[#4F46E5] text-white"
                      : isCurrent
                      ? "border-2 border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5]"
                      : "border border-[#CBD5E1] bg-white text-[#94A3B8]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </span>

                {/* Titre de l'étape */}
                <div className="flex flex-col text-left">
                  <span
                    className={cn(
                      "text-xs font-semibold whitespace-nowrap",
                      isCurrent
                        ? "text-[#0F172A]"
                        : isCompleted
                        ? "text-[#334155]"
                        : "text-[#94A3B8]"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-[11px] text-[#64748B] hidden md:inline">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Ligne de liaison vers l'étape suivante */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-all",
                    isCompleted ? "bg-[#4F46E5]" : "bg-[#E2E8F0]"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
