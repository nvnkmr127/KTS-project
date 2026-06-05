import React from 'react';
import type { ColorVariant } from '../types';

const variantClasses: Record<ColorVariant, string> = {
  blue: 'bg-[var(--blue-bg)] text-[var(--blue-tx)]',
  teal: 'bg-[var(--teal-bg)] text-[var(--teal-tx)]',
  amber: 'bg-[var(--amber-bg)] text-[var(--amber-tx)]',
  coral: 'bg-[var(--coral-bg)] text-[var(--coral-tx)]',
  purple: 'bg-[var(--purple-bg)] text-[var(--purple-tx)]',
  green: 'bg-[var(--green-bg)] text-[var(--green-tx)]',
  red: 'bg-[var(--red-bg)] text-[var(--red-tx)]',
  pink: 'bg-[var(--pink-bg)] text-[var(--pink-tx)]',
  gray: 'bg-[var(--surf2)] text-[var(--tx2)]',
};

interface BadgeProps {
  variant?: ColorVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface TrendBadgeProps {
  direction: 'up' | 'down';
  children: React.ReactNode;
}

export function TrendBadge({ direction, children }: TrendBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${
        direction === 'up'
          ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)]'
          : 'bg-[var(--red-bg)] text-[var(--red-tx)]'
      }`}
    >
      {children}
    </span>
  );
}
