'use client';

import { memo } from 'react';

function StatsSkeletonComponent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-surface rounded-xl border border-subtle p-6">
          <div className="h-4 bg-surface-secondary rounded w-1/2 mb-3" />
          <div className="h-8 bg-surface-secondary rounded w-3/4 mb-2" />
          <div className="h-3 bg-surface-secondary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export const StatsSkeleton = memo(StatsSkeletonComponent);

