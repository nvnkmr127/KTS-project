import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: { direction: 'up' | 'down'; label: string };
  onClick?: () => void;
  hoverValue?: React.ReactNode;
}

export function KPICard({ label, value, sub, icon, iconBg, iconColor, trend, onClick, hoverValue }: KPICardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-[var(--surf)] border border-[var(--b)] rounded-xl p-3 relative overflow-hidden transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:border-[var(--blue)] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      <div
        className="absolute right-2.5 top-2.5 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="text-[10.5px] text-[var(--tx3)] mb-1">{label}</div>
      <div className="text-[20px] font-semibold text-[var(--tx)] leading-none mb-1">{value}</div>
      {(sub || hoverValue) && !trend && (
        <div className="text-[10.5px] text-[var(--tx3)] min-h-[16px] transition-all duration-150">
          {isHovered && hoverValue ? (
            <span className="text-[var(--tx2)] font-medium">{hoverValue}</span>
          ) : (
            sub
          )}
        </div>
      )}
      {trend && (
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${
              trend.direction === 'up'
                ? 'bg-[var(--teal-bg)] text-[var(--teal-tx)]'
                : 'bg-[var(--red-bg)] text-[var(--red-tx)]'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={9} />
            ) : (
              <TrendingDown size={9} />
            )}
            {trend.label}
          </span>
          {(sub || hoverValue) && (
            <span className="text-[10.5px] text-[var(--tx3)] min-h-[16px] transition-all duration-150">
              {isHovered && hoverValue ? (
                <span className="text-[var(--tx2)] font-medium">{hoverValue}</span>
              ) : (
                sub
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

