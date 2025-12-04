'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './ui/ToastContainer';
import { queryClient } from '@/lib/react-query';
import { FilterProvider } from '@/contexts/FilterContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
    <SessionProvider>
        <ThemeProvider>
          <FilterProvider>
            <ToastProvider>{children}</ToastProvider>
          </FilterProvider>
        </ThemeProvider>
    </SessionProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
