'use client';

import { useMemo } from 'react';
import { ListingCard } from './ListingCard';
import { useTranslations } from 'next-intl';
import { useInfiniteListings } from '@/hooks/useListings';
import { ListingGridSkeleton } from '../skeletons/ListingGridSkeleton';

interface ListingGridProps {
  compact?: boolean;
}

export function ListingGrid({ compact = false }: ListingGridProps) {
  const t = useTranslations('listing');
  const tCommon = useTranslations('common');

  // Використовуємо React Query з infinite scroll
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteListings();

  // Мемоізуємо список listings з усіх сторінок
  const listings = useMemo(() => {
    return data?.pages.flatMap((page) => page.listings || []) || [];
  }, [data]);

  if (isLoading) {
    return <ListingGridSkeleton count={compact ? 3 : 6} compact={compact} />;
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{t('errorLoading') || 'Error loading listings'}</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('noListings')}</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`grid gap-4 ${
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className="fade-up"
            style={{
              animationDelay: `${index * 30}ms`,
            }}>
            <ListingCard listing={listing} variant="grid" priority={index < 6} />
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {isFetchingNextPage ? tCommon('loading') : t('loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
