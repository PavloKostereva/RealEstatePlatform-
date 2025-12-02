'use client';

import { memo } from 'react';

interface TableRowsSkeletonProps {
  rows?: number;
  columns?: number;
}

function TableRowsSkeletonComponent({ rows = 5, columns = 5 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-subtle/60 animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <div className="flex items-center gap-3">
                {colIndex === 0 && (
                  <>
                    <div className="h-10 w-10 rounded-lg bg-surface-secondary flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-surface-secondary rounded w-3/4" />
                      <div className="h-3 bg-surface-secondary rounded w-1/2" />
                    </div>
                  </>
                )}
                {colIndex !== 0 && (
                  <div className="h-4 bg-surface-secondary rounded w-20" />
                )}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export const TableRowsSkeleton = memo(TableRowsSkeletonComponent);

