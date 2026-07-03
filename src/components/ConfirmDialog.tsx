import React, { useEffect } from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && !loading) {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <button
          aria-label="Close dialog"
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-[var(--surf2)] text-[var(--tx3)] hover:text-[var(--tx)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <X size={15} />
        </button>

        <div className="p-6 text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDestructive
                ? 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                : 'bg-amber-100 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <AlertCircle size={24} />
          </div>
          <h3 id="confirm-dialog-title" className="text-base font-bold text-[var(--tx)] mb-2">{title}</h3>
          <p id="confirm-dialog-description" className="text-xs text-[var(--tx3)] mb-6 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer disabled:opacity-50 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 text-white rounded-xl text-[12px] font-semibold cursor-pointer disabled:opacity-70 flex items-center justify-center gap-1.5 transition-colors ${
                isDestructive
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[var(--blue)] hover:opacity-90'
              }`}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
