"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" strokeWidth={2} />,
    warning: <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" strokeWidth={2} />,
    error: <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" strokeWidth={2} />,
    info: <Info className="w-4 h-4 text-[#4F46E5] shrink-0" strokeWidth={2} />,
  };

  const borderStyles = {
    success: "border-[#BBF7D0] bg-[#F0FDF4]",
    warning: "border-[#FDE68A] bg-[#FFFBEB]",
    error: "border-[#FECACA] bg-[#FEF2F2]",
    info: "border-[#E0E7FF] bg-[#EEF2FF]",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg transition-all animate-in slide-in-from-bottom-2 duration-150",
              borderStyles[t.type]
            )}
          >
            <div className="pt-0.5">{icons[t.type]}</div>
            <div className="flex-1 flex flex-col gap-0.5 text-left">
              <span className="text-xs font-semibold text-[#0F172A] leading-tight">
                {t.title}
              </span>
              {t.message && (
                <span className="text-xs text-[#64748B] leading-relaxed">
                  {t.message}
                </span>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
