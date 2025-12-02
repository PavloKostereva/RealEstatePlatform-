'use client';

import { memo } from 'react';
import { ListingCardSkeleton } from './ListingCardSkeleton';

interface ListingGridSkeletonProps {
  count?: number;
  compact?: boolean;
}

function ListingGridSkeletonComponent({ count = 6, compact = false }: ListingGridSkeletonProps) {
  return (
    <div
      className={`grid gap-4 ${
        compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={index} variant="grid" />
      ))}
    </div>
  );
}

export const ListingGridSkeleton = memo(ListingGridSkeletonComponent);

