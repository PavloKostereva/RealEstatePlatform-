'use client';

import { memo } from 'react';

function MapSkeletonComponent() {
  return (
    <div
      className="w-full h-full rounded-lg bg-surface-secondary animate-pulse flex items-center justify-center"
      style={{ minHeight: '600px' }}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Завантаження карти...</p>
      </div>
    </div>
  );
}

export const MapSkeleton = memo(MapSkeletonComponent);
