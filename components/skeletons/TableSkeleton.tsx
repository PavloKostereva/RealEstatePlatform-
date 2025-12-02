'use client';

import { memo } from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableSkeletonComponent({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
      <div className="w-full">
        <div className="bg-surface-secondary border-b border-subtle">
          <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, index) => (
              <div key={index} className="h-4 bg-surface rounded w-20" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-subtle">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 p-4 animate-pulse"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="space-y-2">
                  <div className="h-4 bg-surface-secondary rounded w-full" />
                  {colIndex === 0 && <div className="h-3 bg-surface-secondary rounded w-2/3" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const TableSkeleton = memo(TableSkeletonComponent);

