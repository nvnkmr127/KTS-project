import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertCircle, X, CheckCircle2, HelpCircle } from 'lucide-react';

interface DialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isAlert?: boolean;
}

interface DialogContextType {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string, isDestructive?: boolean) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, title: string = 'Confirm Action', isDestructive: boolean = false): Promise<boolean> => {
    setOptions({
      title,
      message,
      isDestructive,
      isAlert: false,
      confirmText: 'Confirm',
      cancelText: 'Cancel'
    });
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const alert = useCallback((message: string, title: string = 'Notice'): Promise<void> => {
    setOptions({
      title,
      message,
      isDestructive: false,
      isAlert: true,
      confirmText: 'OK',
    });
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div 
            className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[420px] shadow-2xl overflow-hidden relative animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            {!options.isAlert && (
              <button
                aria-label="Close dialog"
                onClick={handleCancel}
                className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] hover:text-[var(--tx)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}

            <div className="p-6 text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  options.isAlert
                    ? 'bg-blue-50 dark:bg-blue-950/20 text-[var(--blue)]'
                    : options.isDestructive
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {options.isAlert ? (
                  <CheckCircle2 size={24} />
                ) : options.isDestructive ? (
                  <AlertCircle size={24} />
                ) : (
                  <HelpCircle size={24} />
                )}
              </div>
              <h3 id="dialog-title" className="text-base font-bold text-[var(--tx)] mb-2">{options.title}</h3>
              <p id="dialog-description" className="text-[12px] text-[var(--tx2)] mb-6 leading-relaxed whitespace-pre-wrap">{options.message}</p>
              
              <div className="flex gap-3 justify-center">
                {!options.isAlert && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer transition-colors"
                  >
                    {options.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`py-2.5 text-white rounded-xl text-[12px] font-semibold cursor-pointer transition-colors ${
                    options.isAlert ? 'px-8 min-w-[120px] mx-auto' : 'flex-1'
                  } ${
                    options.isDestructive
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-[var(--blue)] hover:opacity-90'
                  }`}
                >
                  {options.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
