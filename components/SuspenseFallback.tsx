'use client';

import { memo } from 'react';
import { ListingGridSkeleton } from './skeletons/ListingGridSkeleton';

export const SuspenseFallback = memo(() => (
  <div className="container mx-auto px-4 py-8">
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface-secondary rounded w-1/3" />
        <div className="h-4 bg-surface-secondary rounded w-1/2" />
      </div>
      
      {/* Content skeleton */}
      <ListingGridSkeleton count={6} />
    </div>
  </div>
));

SuspenseFallback.displayName = 'SuspenseFallback';

