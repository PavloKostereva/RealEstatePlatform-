'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ListingCard } from '@/components/listings/ListingCard';
import { CheckoutModal } from '@/components/listings/CheckoutModal';
import { useListings } from '@/hooks/useListings';
import { ListingGridSkeleton } from '@/components/skeletons/ListingGridSkeleton';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { useFilters } from '@/contexts/FilterContext';
import { SearchFilters } from '@/components/search/SearchFilters';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

interface Listing {
  id: string;
  title: string;
  latitude?: number;
  longitude?: number;
  price: number;
  currency: string;
  type: string;
  category: string;
  address: string;
  images: string[];
  area?: number;
  rooms?: number;
  createdAt?: string;
}

const viewModes = ['grid', 'list'] as const;

export function HomeMapWithListings() {
  const t = useTranslations('home');
  const { filters } = useFilters();

  // Використовуємо React Query для завантаження listings
  const { data: listingsData, isLoading: loading } = useListings({
    status: 'PUBLISHED',
    limit: 1000,
  });

  // Мемоізуємо listings з координатами та застосовуємо фільтри
  const listings = useMemo(() => {
    if (!listingsData?.listings) return [];

    let filtered = listingsData.listings.filter(
      (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude),
    ) as unknown as Listing[];

    // Фільтр по запиту (query)
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(queryLower) ||
          l.address.toLowerCase().includes(queryLower),
      );
    }

    // Фільтр по розміру (size)
    if (filters.size) {
      filtered = filtered.filter((l) => {
        if (!l.area) return false;
        if (filters.size === 'small') return l.area < 50;
        if (filters.size === 'medium') return l.area >= 50 && l.area < 100;
        if (filters.size === 'large') return l.area >= 100;
        return true;
      });
    }

    // Фільтр по мітці (label) - наприклад, "new"
    if (filters.label === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((l) => {
        if (!l.createdAt) return false;
        const createdAt = new Date(l.createdAt);
        return createdAt >= thirtyDaysAgo;
      });
    }

    // Сортування по ціні
    if (filters.sortBy === 'priceAsc') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'priceDesc') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [listingsData, filters]);

  const [center, setCenter] = useState({ lat: 54.5, lng: 15.0 }); // Center of Europe (shifted north to show all of Europe)
  const [mapZoom, setMapZoom] = useState(4); // Zoom to show Europe (continental view)
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]>('list');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(
    undefined,
  );

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Радіус Землі в кілометрах
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Відстань в кілометрах
    },
    [],
  );

  // Мемоізуємо обчислення listings з відстанями
  const getListingsWithDistance = useCallback(
    (userLat: number, userLng: number) => {
      return listings
        .filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude))
        .map((listing) => ({
          ...listing,
          distance: calculateDistance(userLat, userLng, listing.latitude!, listing.longitude!),
        }))
        .sort((a, b) => a.distance - b.distance);
    },
    [listings, calculateDistance],
  );

  // Обробник для кнопки "Near Me"
  const handleNearMe = useCallback(
    (userLat: number, userLng: number) => {
      // Встановлюємо позицію користувача для показу маркера на карті
      setUserLocation({ lat: userLat, lng: userLng });

      // Знаходимо найближчий лістинг
      const listingsWithDistance = getListingsWithDistance(userLat, userLng);

      if (listingsWithDistance.length > 0) {
        const nearestListing = listingsWithDistance[0];

        // Центруємо карту так, щоб було видно і користувача, і найближчий лістинг
        // Використовуємо середнє значення для центру
        const centerLat = (userLat + nearestListing.latitude!) / 2;
        const centerLng = (userLng + nearestListing.longitude!) / 2;

        setCenter({
          lat: centerLat,
          lng: centerLng,
        });

        // Автоматично визначаємо оптимальний zoom для показу обох точок
        // Використовуємо приблизний розрахунок на основі відстані
        const distance = calculateDistance(
          userLat,
          userLng,
          nearestListing.latitude!,
          nearestListing.longitude!,
        );
        let optimalZoom = 12;
        if (distance > 50) optimalZoom = 8;
        else if (distance > 20) optimalZoom = 9;
        else if (distance > 10) optimalZoom = 10;
        else if (distance > 5) optimalZoom = 11;
        else if (distance > 2) optimalZoom = 12;
        else optimalZoom = 13;

        setMapZoom(optimalZoom);

        // Показуємо найближчий лістинг в консолі
        console.log(
          `Найближчий лістинг: ${nearestListing.title} (${nearestListing.distance.toFixed(2)} км)`,
        );

        // Використовуємо fitBounds через глобальну функцію для синхронізації з картою
        // Затримка для того, щоб карта встигла оновитися
        setTimeout(() => {
          if (typeof window !== 'undefined' && 'fitMapBounds' in window) {
            (window as { fitMapBounds?: (bounds: number[][]) => void }).fitMapBounds?.([
              [userLat, userLng],
              [nearestListing.latitude!, nearestListing.longitude!],
            ]);
          }
        }, 300);

        // НЕ відкриваємо модальне вікно автоматично - користувач сам може клікнути на маркер
      } else {
        // Якщо немає лістингів з координатами, просто центруємо на позиції користувача
        setCenter({ lat: userLat, lng: userLng });
        setMapZoom(12);
        alert('Поблизу немає оголошень з координатами.');
      }
    },
    [getListingsWithDistance],
  );

  // Реєструємо callback для SearchFilters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as { handleNearMeMap?: typeof handleNearMe }).handleNearMeMap = handleNearMe;
      return () => {
        if (typeof window !== 'undefined' && 'handleNearMeMap' in window) {
          delete (window as { handleNearMeMap?: typeof handleNearMe }).handleNearMeMap;
        }
      };
    }
  }, [handleNearMe, listings, calculateDistance]);

  // Мемоізуємо маркери для карти
  const markers = useMemo(
    () =>
      listings
        .filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude))
        .map((l) => ({
          id: l.id,
          latitude: l.latitude as number,
          longitude: l.longitude as number,
          title: l.title,
          address: l.address,
          price: l.price,
          currency: l.currency,
          images: l.images,
          rating: 4.8, // Mock rating
          reviewsCount: 0, // Mock reviews count
        })),
    [listings],
  );

  // При кліку на маркер не переходимо на детальну сторінку - popup відкривається автоматично
  const handleMarkerClick = useCallback(() => {
    // Не переходимо на детальну сторінку - просто показуємо popup
    // Popup відкривається автоматично через bindPopup в MapView
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

  const handleImageClick = useCallback(
    (marker: { id: string }) => {
      const listing = listings.find((l) => l.id === marker.id);
      if (listing) {
        setSelectedListing(listing);
        setIsCheckoutModalOpen(true);
      }
    },
    [listings],
  );

  const renderListView = () => (
    <div className="mt-6 space-y-2">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className="fade-up"
          style={{
            animationDelay: `${index * 30}ms`,
          }}>
          <ListingCard listing={listing} variant="list" />
        </div>
      ))}
    </div>
  );

  const renderGridView = () => (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className="fade-up"
          style={{
            animationDelay: `${index * 30}ms`,
          }}>
          <ListingCard listing={listing} variant="grid" />
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <MapSkeleton />
        <ListingGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-2">{t('mapTitle')}</h2>
          <p className="text-gray-600 text-sm">{t('foundListings', { count: listings.length })}</p>
        </div>
        <div style={{ height: '600px' }}>
          <MapView
            latitude={center.lat}
            longitude={center.lng}
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onZoomChange={handleZoomChange}
            onImageClick={handleImageClick}
            zoom={mapZoom}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* Фільтри під картою */}
      <div className="mt-6">
        <SearchFilters useLocalFilters={true} />
      </div>

      {selectedListing && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => {
            setIsCheckoutModalOpen(false);
            setSelectedListing(null);
          }}
          listing={selectedListing}
        />
      )}

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-muted-foreground">
        <span>{t('foundListings', { count: listings.length })}</span>
        <div className="flex gap-2">
          {viewModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg border transition font-medium uppercase tracking-wide ${
                viewMode === mode
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-surface-secondary text-muted-foreground border-subtle hover:border-primary-400'
              }`}>
              {mode === 'grid' ? t('viewGrid') : t('viewList')}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? renderGridView() : renderListView()}
    </div>
  );
}
