'use client';

import { useMemo } from 'react';
import { ListingCard } from '../listings/ListingCard';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ListingGridSkeleton } from '../skeletons/ListingGridSkeleton';

interface SavedListingsProps {
  userId: string;
}

export function SavedListings({ userId }: SavedListingsProps) {
  // Використовуємо React Query замість useState + fetch
  const { data, isLoading: loading } = useQuery({
    queryKey: ['saved', 'list', userId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/saved?userId=${userId}`);
      return data.map((item: { listing: Record<string, unknown> }) => item.listing);
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 хвилина
  });

  // Мемоізуємо listings
  const listings = useMemo(() => data || [], [data]) as Array<{
    id: string;
    title: string;
    type: string;
    category: string;
    price: number;
    currency: string;
    address: string;
    images: string[];
    area?: number;
    rooms?: number;
    latitude?: number;
    longitude?: number;
    isPrivate?: boolean;
    private?: boolean;
  }>;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-7 bg-surface-secondary rounded w-48 mb-6 animate-pulse" />
        <ListingGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Збережені оголошення</h2>
      {listings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">У вас поки що немає збережених оголошень</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
