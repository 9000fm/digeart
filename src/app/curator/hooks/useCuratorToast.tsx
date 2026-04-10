"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface CuratorToast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: CuratorToast[];
  showToast: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: number) => void;
  /** Timestamp of the most recent successful mutation (driven by showToast(_, "success")) */
  lastSavedAt: number | null;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function CuratorToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<CuratorToast[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((curr) => {
      const next = [...curr, { id, message, variant }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    if (variant === "success") setLastSavedAt(Date.now());
    const ttl = variant === "error" ? 5000 : 2500;
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss, lastSavedAt }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useCuratorToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op fallback when used outside provider — avoids hard crashes
    return {
      toasts: [],
      showToast: () => {},
      dismiss: () => {},
      lastSavedAt: null,
    };
  }
  return ctx;
}
