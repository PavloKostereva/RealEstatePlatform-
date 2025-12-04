'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('./MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false, // Карта не потребує SSR
  },
);
import Image from 'next/image';
import { useListings } from '@/hooks/useListings';

interface Listing {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
  type: string;
  address?: string;
  images?: string[];
}

const viewModes = ['map', 'list', 'grid'] as const;
const ITEMS_PER_PAGE = 12;

export function MapPageContent() {
  const router = useRouter();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [center] = useState({ lat: 54.5, lng: 15.0 }); // Center of Europe (shifted north to show all of Europe)
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]>('map');
  const [currentPage, setCurrentPage] = useState(1);

  // Використовуємо React Query замість fetch
  const { data: listingsData, isLoading } = useListings({
    status: 'PUBLISHED',
    limit: 1000,
  });

  // Мемоізуємо всі listings з координатами
  const allListingsMemo = useMemo(() => {
    if (!listingsData?.listings) return [];
    return listingsData.listings
      .filter((l) => l.latitude && l.longitude)
      .map((l) => ({
        id: l.id,
        title: l.title,
        latitude: l.latitude!,
        longitude: l.longitude!,
        price: l.price,
        currency: l.currency,
        type: l.type,
        address: l.address,
        images: l.images,
      })) as Listing[];
  }, [listingsData]);

  // Синхронізуємо зі старим станом для сумісності
  useEffect(() => {
    setAllListings(allListingsMemo);
    setLoading(isLoading);
  }, [allListingsMemo, isLoading]);

  // Мемоізуємо відфільтровані listings
  const listings = useMemo(() => {
    if (viewMode === 'map') {
      return allListings;
    } else {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      return allListings.slice(startIndex, endIndex);
    }
  }, [viewMode, currentPage, allListings]);

  const handleMarkerClick = (marker: { id: string }) => {
    router.push(`/listings/${marker.id}`);
  };

  const totalPages = Math.ceil(allListings.length / ITEMS_PER_PAGE);
  const hasMore = currentPage < totalPages;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleViewModeChange = (mode: (typeof viewModes)[number]) => {
    setViewMode(mode);
    setCurrentPage(1); // Скидаємо на першу сторінку при зміні режиму
  };

  const viewToggle = (
    <div className="flex gap-2">
      {viewModes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => handleViewModeChange(mode)}
          className={`px-4 py-2 rounded-lg border transition font-medium capitalize ${
            viewMode === mode
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-surface-secondary text-muted-foreground border-subtle hover:border-primary-400'
          }`}>
          {mode === 'map' ? 'Map' : mode === 'list' ? 'List' : 'Grid'}
        </button>
      ))}
    </div>
  );

  // Skeleton для карти
  const MapSkeleton = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
      <div className="w-full h-full bg-gray-200 animate-pulse relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Завантаження карти...</p>
          </div>
        </div>
        {/* Імітація контролів карти */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <div className="w-10 h-10 bg-white rounded shadow-md animate-pulse"></div>
          <div className="w-10 h-10 bg-white rounded shadow-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Skeleton для списку
  const ListSkeleton = () => (
    <div className="mt-6 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="w-full bg-surface rounded-lg border border-subtle p-5 flex flex-col md:flex-row gap-4">
          <div className="md:w-48 md:min-w-[12rem] h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Skeleton для сітки
  const GridSkeleton = () => (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="h-44 w-full bg-gray-200 animate-pulse"></div>
          <div className="p-4 space-y-3">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <>
      <div className="mt-6 space-y-4">
        {listings.map((listing) => (
          <button
            key={listing.id}
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="w-full text-left bg-surface rounded-lg border border-subtle p-5 flex flex-col md:flex-row gap-4 hover:border-primary-400 transition">
            <div className="md:w-48 md:min-w-[12rem] h-32 relative rounded-lg overflow-hidden bg-surface-secondary">
              <Image
                src={
                  listing.images?.[0] ??
                  'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
                }
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 12rem"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 uppercase">
                <span>{listing.type === 'RENT' ? 'Оренда' : 'Продаж'}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mt-1">{listing.title}</h3>
              {listing.address && (
                <p className="text-muted-foreground text-sm mt-1">{listing.address}</p>
              )}
              <div className="mt-3 text-xl font-bold text-primary-500">
                {listing.price.toLocaleString()} {listing.currency}
              </div>
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-400 transition">
              Попередня
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Показуємо перші 3, останні 3, і поточну сторінку з контекстом
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      currentPage === page
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-subtle hover:border-primary-400'
                    }`}>
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-lg border border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-400 transition">
              Наступна
            </button>
          </div>
        </div>
      )}
    </>
  );

  const renderGrid = () => (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <button
            key={listing.id}
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="bg-surface border border-subtle rounded-xl overflow-hidden shadow-sm hover:border-primary-400 transition">
            <div className="relative h-44 w-full">
              <Image
                src={
                  listing.images?.[0] ??
                  'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
                }
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <span className="absolute top-3 right-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase">
                {listing.type === 'RENT' ? 'Оренда' : 'Продаж'}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">{listing.title}</h3>
              <div className="text-primary-500 font-bold text-lg mb-2">
                {listing.price.toLocaleString()} {listing.currency}
              </div>
              {listing.address && (
                <p className="text-muted-foreground text-sm">{listing.address}</p>
              )}
            </div>
          </button>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-400 transition">
              Попередня
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              // Показуємо перші 3, останні 3, і поточну сторінку з контекстом
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      currentPage === page
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-subtle hover:border-primary-400'
                    }`}>
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-lg border border-subtle disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-400 transition">
              Наступна
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Карта оголошень</h1>

      {/* Карта або skeleton для карти */}
      {loading ? (
        <MapSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
          <MapView
            latitude={center.lat}
            longitude={center.lng}
            markers={allListings.map((l) => ({
              id: l.id,
              latitude: l.latitude,
              longitude: l.longitude,
              title: l.title,
            }))}
            onMarkerClick={handleMarkerClick}
            zoom={10}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Знайдено оголошень: {allListings.length}
          {viewMode !== 'map' && ` (показано: ${listings.length})`}
        </span>
        {viewToggle}
      </div>

      {/* Вміст залежно від режиму перегляду */}
      {loading ? (
        <>
          {viewMode === 'list' && <ListSkeleton />}
          {viewMode === 'grid' && <GridSkeleton />}
        </>
      ) : (
        <>
          {viewMode === 'list' && renderList()}
          {viewMode === 'grid' && renderGrid()}
        </>
      )}
    </div>
  );
}
