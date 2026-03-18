// components/ui/toast.tsx
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ToastContext = React.createContext<{
  toast: (props: Omit<ToastProps, 'id' | 'open' | 'onOpenChange'>) => void;
}>({
  toast: () => {},
});

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { id: string }>>([]);

  const toast = React.useCallback(
    (props: Omit<ToastProps, 'id' | 'open' | 'onOpenChange'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...props, id, open: true }]);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function Toast({
//   className,
  title,
  description,
  action,
  variant = 'default',
  open = true,
  onOpenChange,
  ...props
}: ToastProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'group pointer-events-auto relative flex w-full max-w-sm items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        variant === 'destructive'
          ? 'border-red-500 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50'
          : 'border-gray-200 bg-white text-gray-950 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
        // className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && <div className="mb-1 font-semibold">{title}</div>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {action}
      <button
        onClick={() => onOpenChange?.(false)}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-950/50 opacity-0 transition-opacity hover:text-gray-950 focus:opacity-100 focus:outline-none group-hover:opacity-100 dark:text-gray-50/50 dark:hover:text-gray-50"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}