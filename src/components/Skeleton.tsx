import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle = false }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`animate-pulse bg-[var(--b2)] ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={style}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {/* Header Skeleton */}
      <div className="flex gap-4 py-2.5 border-b border-[var(--b)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="flex-1" height={16} />
        ))}
      </div>
      {/* Rows Skeleton */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4 py-3.5 border-b border-[var(--b)] items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="flex-1" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
}

export function CardGridSkeleton({ count = 3 }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--surf)] border border-[var(--b)] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div className="space-y-1.5 flex-1">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={10} />
            </div>
          </div>
          <Skeleton width="100%" height={10} />
          <div className="flex justify-between items-center pt-2">
            <Skeleton width="30%" height={16} />
            <Skeleton width="20%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
