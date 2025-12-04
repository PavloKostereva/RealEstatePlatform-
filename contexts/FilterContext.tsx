'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FilterState {
  query: string;
  sortBy: string;
  size: string;
  label: string;
  nearMe: boolean;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>({
    query: '',
    sortBy: '',
    size: '',
    label: '',
    nearMe: false,
  });

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFiltersState({
      query: '',
      sortBy: '',
      size: '',
      label: '',
      nearMe: false,
    });
  };

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

