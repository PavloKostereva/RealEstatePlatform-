import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';

// Ключі для кешування адмін даних
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  listings: (status?: string) => [...adminKeys.all, 'listings', status] as const,
  users: () => [...adminKeys.all, 'users'] as const,
};

// Hook для отримання статистики
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminApi.getStats,
    staleTime: 1 * 60 * 1000, // 1 хвилина
    refetchInterval: 5 * 60 * 1000, // Автоматичне оновлення кожні 5 хвилин
  });
}

// Hook для отримання listings для адміна
export function useAdminListings(status?: string) {
  return useQuery({
    queryKey: adminKeys.listings(status),
    queryFn: () => adminApi.getAdminListings(status),
    staleTime: 30 * 1000, // 30 секунд
  });
}

