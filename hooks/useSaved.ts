import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedApi } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

// Ключі для кешування saved listings
export const savedKeys = {
  all: ['saved'] as const,
  listing: (listingId: string) => [...savedKeys.all, listingId] as const,
  list: (userId?: string) => [...savedKeys.all, 'list', userId] as const,
};

// Hook для перевірки чи listing збережений
export function useSavedListing(listingId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: savedKeys.listing(listingId),
    queryFn: () => savedApi.checkSaved(listingId),
    enabled: !!session && !!listingId,
    staleTime: 1 * 60 * 1000, // 1 хвилина
    retry: false,
  });
}

// Hook для toggle saved listing
export function useToggleSaved() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  
  return useMutation({
    mutationFn: ({ listingId, isSaved }: { listingId: string; isSaved: boolean }) =>
      savedApi.toggleSaved(listingId, isSaved),
    onSuccess: (_, variables) => {
      const newSavedState = !variables.isSaved;
      
      // Оновлюємо кеш для конкретного listing
      queryClient.setQueryData(
        savedKeys.listing(variables.listingId),
        { saved: newSavedState }
      );
      
      // Інвалідуємо та перезапитуємо кеш для конкретного listing, щоб переконатися що дані актуальні
      queryClient.invalidateQueries({ 
        queryKey: savedKeys.listing(variables.listingId) 
      });
      
      // Інвалідуємо список saved listings
      queryClient.invalidateQueries({ 
        queryKey: savedKeys.list(session?.user?.id) 
      });
      
      // Також інвалідуємо всі saved queries для повного оновлення
      queryClient.invalidateQueries({ 
        queryKey: savedKeys.all 
      });
    },
  });
}

