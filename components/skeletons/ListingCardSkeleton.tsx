'use client';

import { memo } from 'react';

interface ListingCardSkeletonProps {
  variant?: 'grid' | 'list';
}

function ListingCardSkeletonComponent({ variant = 'grid' }: ListingCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className="bg-surface rounded-lg border border-subtle overflow-hidden animate-pulse">
        <div className="flex gap-3 p-3">
          <div className="w-16 h-16 rounded-lg bg-surface-secondary flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-surface-secondary rounded w-3/4" />
            <div className="h-3 bg-surface-secondary rounded w-1/2" />
            <div className="h-3 bg-surface-secondary rounded w-1/4" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-9 w-20 bg-surface-secondary rounded-xl" />
            <div className="h-9 w-24 bg-surface-secondary rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-subtle overflow-hidden animate-pulse flex flex-col h-full">
      {/* Image skeleton */}
      <div className="relative w-full h-48 bg-surface-secondary" />

      {/* Content skeleton */}
      <div className="flex-1 p-4 flex flex-col space-y-3">
        <div className="h-5 bg-surface-secondary rounded w-4/5" />
        <div className="h-4 bg-surface-secondary rounded w-2/3" />
        <div className="mt-auto space-y-2">
          <div className="h-6 bg-surface-secondary rounded w-1/3" />
          <div className="h-4 bg-surface-secondary rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export const ListingCardSkeleton = memo(ListingCardSkeletonComponent);

