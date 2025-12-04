'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useFilters } from '@/contexts/FilterContext';

interface SearchFiltersProps {
  onNearMeClick?: (lat: number, lng: number) => void;
  useLocalFilters?: boolean; // Новий проп для локальних фільтрів
}

export function SearchFilters({ onNearMeClick, useLocalFilters = false }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('filters');
  const tCommon = useTranslations('common');
  const { filters, setFilters, resetFilters: resetContextFilters } = useFilters();
  
  const [query, setQuery] = useState(useLocalFilters ? filters.query : (searchParams.get('q') || ''));
  const [nearMe, setNearMe] = useState(useLocalFilters ? filters.nearMe : (searchParams.get('nearMe') === 'true'));
  const [sortBy, setSortBy] = useState(useLocalFilters ? filters.sortBy : (searchParams.get('sortBy') || ''));
  const [size, setSize] = useState(useLocalFilters ? filters.size : (searchParams.get('size') || ''));
  const [label, setLabel] = useState(useLocalFilters ? filters.label : (searchParams.get('label') || ''));
  const [gettingLocation, setGettingLocation] = useState(false);

  // Синхронізуємо локальний стан з контекстом
  useEffect(() => {
    if (useLocalFilters) {
      setQuery(filters.query);
      setNearMe(filters.nearMe);
      setSortBy(filters.sortBy);
      setSize(filters.size);
      setLabel(filters.label);
    }
  }, [filters, useLocalFilters]);

  const applyFilters = () => {
    if (useLocalFilters) {
      // Використовуємо локальні фільтри через контекст
      setFilters({ query, nearMe, sortBy, size, label });
    } else {
      // Стара логіка з router.push для інших сторінок
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (nearMe) params.set('nearMe', 'true');
    if (sortBy) params.set('sortBy', sortBy);
    if (size) params.set('size', size);
    if (label) params.set('label', label);

    const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
    const targetPath = isHomePage ? `/${locale}` : `/${locale}/listings`;
    const url = params.toString() ? `${targetPath}?${params.toString()}` : targetPath;

    router.push(url);
    }
  };

  const resetFilters = () => {
    if (useLocalFilters) {
      setQuery('');
      setNearMe(false);
      setSortBy('');
      setSize('');
      setLabel('');
      resetContextFilters();
    } else {
    setQuery('');
    setNearMe(false);
    setSortBy('');
    setSize('');
    setLabel('');
    const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
    const targetPath = isHomePage ? `/${locale}` : `/${locale}/listings`;
    router.push(targetPath);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3 bg-surface rounded-2xl border border-subtle px-4 py-3 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (useLocalFilters) {
                setFilters({ query: e.target.value });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !useLocalFilters) {
                applyFilters();
              }
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full h-11 px-4 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {!useLocalFilters && (
        <button
          onClick={applyFilters}
          className="h-11 px-5 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition">
          {tCommon('search')}
        </button>
        )}

        <button
          onClick={async () => {
            // Перевіряємо чи є глобальний callback для карти (з HomeMapWithListings)
            if (typeof window !== 'undefined' && (window as { handleNearMeMap?: (lat: number, lng: number) => void }).handleNearMeMap) {
              // Використовуємо геолокацію для карти
              setGettingLocation(true);
              try {
                if (typeof navigator !== 'undefined' && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setNearMe(true);
                      (window as unknown as { handleNearMeMap: (lat: number, lng: number) => void }).handleNearMeMap(latitude, longitude);
                      setGettingLocation(false);
                    },
                    (error: GeolocationPositionError) => {
                      // Логуємо тільки в режимі розробки
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('Geolocation error:', error);
                      }
                      
                      let errorMessage = 'Не вдалося отримати ваше розташування.';
                      
                      // Більш зрозумілі повідомлення в залежності від типу помилки
                      if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'Доступ до геолокації заборонено. Будь ласка, дозвольте доступ у налаштуваннях браузера.';
                      } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'Інформація про розташування недоступна. Перевірте, чи увімкнено GPS або Wi-Fi.';
                      } else if (error.code === error.TIMEOUT) {
                        errorMessage = 'Час очікування геолокації вийшов. Спробуйте ще раз.';
                      }
                      
                      alert(errorMessage);
                      setGettingLocation(false);
                      setNearMe(false);
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 10000,
                      maximumAge: 0,
                    },
                  );
                } else {
                  alert('Ваш браузер не підтримує геолокацію.');
                  setGettingLocation(false);
                }
              } catch (error) {
                console.error('Error getting location:', error);
                setGettingLocation(false);
              }
            } else if (onNearMeClick) {
              setGettingLocation(true);
              try {
                if (typeof navigator !== 'undefined' && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setNearMe(true);
                      onNearMeClick(latitude, longitude);
                      setGettingLocation(false);
                    },
                    (error: GeolocationPositionError) => {
                      // Логуємо тільки в режимі розробки
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('Geolocation error:', error);
                      }
                      
                      let errorMessage = 'Не вдалося отримати ваше розташування.';
                      
                      // Більш зрозумілі повідомлення в залежності від типу помилки
                      if (error.code === error.PERMISSION_DENIED) {
                        errorMessage = 'Доступ до геолокації заборонено. Будь ласка, дозвольте доступ у налаштуваннях браузера.';
                      } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMessage = 'Інформація про розташування недоступна. Перевірте, чи увімкнено GPS або Wi-Fi.';
                      } else if (error.code === error.TIMEOUT) {
                        errorMessage = 'Час очікування геолокації вийшов. Спробуйте ще раз.';
                      }
                      
                      alert(errorMessage);
                      setGettingLocation(false);
                      setNearMe(false);
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 10000,
                      maximumAge: 0,
                    },
                  );
                } else {
                  alert('Ваш браузер не підтримує геолокацію.');
                  setGettingLocation(false);
                }
              } catch (error) {
                console.error('Error getting location:', error);
                setGettingLocation(false);
              }
            } else {
              // Якщо немає callback, працюємо як раніше (для сторінки listings)
              setNearMe((prev) => !prev);
              setTimeout(applyFilters, 0);
            }
          }}
          disabled={gettingLocation}
          className={`h-11 px-4 rounded-xl border text-sm font-medium transition ${
            nearMe
              ? 'bg-primary-100 text-primary-700 border-primary-200'
              : 'bg-surface-secondary text-muted-foreground border-subtle hover:border-primary-400'
          } ${gettingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {gettingLocation ? 'Завантаження...' : t('nearMe')}
        </button>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              if (useLocalFilters) {
                setFilters({ sortBy: e.target.value });
              } else {
              setTimeout(applyFilters, 0);
              }
            }}
            className="h-11 appearance-none bg-surface-secondary border border-subtle rounded-xl px-4 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">{t('priceDefault')}</option>
            <option value="priceAsc">{t('priceLow')}</option>
            <option value="priceDesc">{t('priceHigh')}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>

        <div className="relative">
          <select
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              if (useLocalFilters) {
                setFilters({ size: e.target.value });
              } else {
              setTimeout(applyFilters, 0);
              }
            }}
            className="h-11 appearance-none bg-surface-secondary border border-subtle rounded-xl px-4 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">{t('sizeAllOption')}</option>
            <option value="small">{t('sizeSmall')}</option>
            <option value="medium">{t('sizeMedium')}</option>
            <option value="large">{t('sizeLarge')}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>

        <div className="relative">
          <select
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (useLocalFilters) {
                setFilters({ label: e.target.value });
              } else {
              setTimeout(applyFilters, 0);
              }
            }}
            className="h-11 appearance-none bg-surface-secondary border border-subtle rounded-xl px-4 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">{t('labelsAll')}</option>
            <option value="new">{t('labelNew')}</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>

        <button
          onClick={resetFilters}
          className="ml-auto h-11 px-4 rounded-xl text-sm font-semibold text-primary-500 hover:text-primary-600">
          {tCommon('clearAll')}
        </button>
      </div>
    </div>
  );
}
