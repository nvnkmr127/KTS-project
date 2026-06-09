import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', padding = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surf)] border border-[var(--b)] rounded-xl ${padding ? 'p-3.5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function CardHeader({ title, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--tx)]">
        {icon && <span className="text-[var(--tx3)] flex items-center">{icon}</span>}
        {title}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
