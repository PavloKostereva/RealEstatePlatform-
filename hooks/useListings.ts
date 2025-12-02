import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi, ListingsResponse } from '@/lib/api-client';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

// Ключі для кешування
export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...listingKeys.lists(), filters] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
};

// Hook для отримання списку listings
export function useListings(filters?: Record<string, any>) {
  const searchParams = useSearchParams();
  
  // Мемоізуємо параметри запиту
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};
    
    // Додаємо параметри з URL
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Додаємо додаткові фільтри
    if (filters) {
      Object.assign(params, filters);
    }
    
    return params;
  }, [searchParams, filters]);

  return useQuery({
    queryKey: listingKeys.list(queryParams),
    queryFn: () => listingsApi.getListings(queryParams),
    staleTime: 2 * 60 * 1000, // 2 хвилини для listings
  });
}

// Hook для infinite scroll listings
export function useInfiniteListings(filters?: Record<string, any>) {
  const searchParams = useSearchParams();
  
  const queryParams = useMemo(() => {
    const params: Record<string, any> = { page: 1, limit: 12 };
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    if (filters) {
      Object.assign(params, filters);
    }
    
    return params;
  }, [searchParams, filters]);

  return useInfiniteQuery({
    queryKey: [...listingKeys.lists(), 'infinite', queryParams],
    queryFn: ({ pageParam = 1 }) => 
      listingsApi.getListings({ ...queryParams, page: pageParam }),
    getNextPageParam: (lastPage: ListingsResponse) => 
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook для отримання одного listing
export function useListing(id: string | null) {
  return useQuery({
    queryKey: listingKeys.detail(id || ''),
    queryFn: () => listingsApi.getListing(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 хвилин для деталей
  });
}

// Hook для створення listing
export function useCreateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: listingsApi.createListing,
    onSuccess: () => {
      // Інвалідуємо кеш listings після створення
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

// Hook для оновлення listing
export function useUpdateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      listingsApi.updateListing(id, data),
    onSuccess: (_, variables) => {
      // Інвалідуємо кеш конкретного listing та списку
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

