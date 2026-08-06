"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    toast: addToast,
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    info: (message: string) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      
      {/* Toast Container - Responsive Positioning */}
      <div className="fixed top-20 left-4 right-4 md:left-auto md:right-8 z-50 flex flex-col gap-3 pointer-events-none items-center md:items-end">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isInfo = t.type === "info";
          
          return (
            <div
              key={t.id}
              className={`
                pointer-events-auto flex items-start gap-3 px-4 py-3 w-full sm:w-auto sm:min-w-[300px] sm:max-w-[400px] rounded-xl shadow-xl 
                border transition-all animate-init-fade-up
                ${isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}
                ${isError ? "bg-red-50 border-red-200 text-red-800" : ""}
                ${isInfo ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
              `}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <FiCheckCircle size={18} className="text-emerald-600" />}
                {isError && <FiAlertCircle size={18} className="text-red-600" />}
                {isInfo && <FiInfo size={18} className="text-blue-600" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {t.message}
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <FiX size={18} />
              </button>
            </div>
          );
        })}
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
