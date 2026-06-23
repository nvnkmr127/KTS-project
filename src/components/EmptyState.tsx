import React from 'react';
import { Card } from './Card';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center text-center p-8 py-12 border-dashed border-2">
      {icon && (
        <div className="p-3 bg-[var(--surf2)] text-[var(--tx3)] rounded-2xl mb-4 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-[13.5px] font-bold text-[var(--tx)] mb-1">{title}</h3>
      <p className="text-[11.5px] text-[var(--tx3)] max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[var(--blue)] text-white rounded-xl text-[12px] font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          {actionLabel}
        </button>
      )}
    </Card>
  );
}
