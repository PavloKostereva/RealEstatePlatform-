'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSavedListing, useToggleSaved } from '@/hooks/useSaved';
import { useToast } from '@/components/ui/ToastContainer';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    ),
  },
);

interface ListingCardProps {
  listing: {
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
  };
  variant?: 'grid' | 'list';
  priority?: boolean; // Для перших зображень на сторінці
}

function ListingCardComponent({ listing, variant = 'grid', priority = false }: ListingCardProps) {
  const locale = useLocale();
  const t = useTranslations('listing');
  const { data: session } = useSession();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Мемоізуємо обчислення
  const imageUrl = useMemo(() => listing.images?.[0] || null, [listing.images]);
  const typeLabel = useMemo(
    () => (listing.type === 'RENT' ? t('rent') : t('sale')),
    [listing.type, t],
  );
  const isPrivate = useMemo(() => {
    // Перевіряємо явне поле isPrivate або private
    if (listing.isPrivate === true || listing.private === true) {
      return true;
    }

    // Перевіряємо type та category на значення "private" (будь-який регістр)
    const typeStr = String(listing.type || '').toLowerCase();
    const categoryStr = String(listing.category || '').toLowerCase();

    return (
      typeStr === 'private' ||
      categoryStr === 'private' ||
      typeStr.includes('private') ||
      categoryStr.includes('private') ||
      listing.type === 'PRIVATE' ||
      listing.category === 'PRIVATE'
    );
  }, [listing.type, listing.category, listing.isPrivate, listing.private]);
  const listingUrl = useMemo(() => `/${locale}/listings/${listing.id}`, [locale, listing.id]);

  // Використовуємо React Query для перевірки saved статусу
  const { data: savedData, refetch: refetchSaved } = useSavedListing(listing.id);
  const toggleSavedMutation = useToggleSaved();

  // Використовуємо savedData безпосередньо, але з fallback на локальний стан
  const isSavedState = savedData?.saved ?? isSaved;

  // Синхронізуємо локальний стан з React Query
  useEffect(() => {
    if (savedData !== undefined) {
      setIsSaved(savedData.saved || false);
    }
  }, [savedData]);

  const toggleSaved = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!session) {
        toast.warning('Будь ласка, увійдіть, щоб зберігати оголошення');
        return;
      }

      if (toggleSavedMutation.isPending) {
        return; // Запобігаємо подвійним клікам
      }

      // Оптимістичне оновлення - одразу змінюємо стан
      const newSavedState = !isSavedState;
      setIsSaved(newSavedState);

      toggleSavedMutation.mutate(
        {
          listingId: listing.id,
          isSaved: isSavedState,
        },
        {
          onSuccess: () => {
            // Перезапитуємо дані для переконання що все синхронізовано
            refetchSaved();
          },
          onError: (error) => {
            // Відкатуємо оптимістичне оновлення при помилці
            setIsSaved(!newSavedState);
            console.error('Error toggling saved:', error);
            toast.error('Помилка при збереженні оголошення. Спробуйте ще раз.');
          },
        },
      );
    },
    [session, listing.id, isSavedState, toggleSavedMutation, refetchSaved],
  );

  if (variant === 'list') {
    return (
      <>
        <div className="bg-surface rounded-lg border border-subtle overflow-hidden hover:border-primary-400 hover:bg-accent/50 transition-colors cursor-pointer relative">
          <div className="flex gap-3 p-3">
            <Link href={listingUrl} className="flex gap-3 flex-1 min-w-0" prefetch={true}>
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loading="lazy"
                    quality={75}
                  />
                ) : (
                  <div className="w-full h-full bg-surface-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">{t('noImages')}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">
                    {listing.title}
                  </h3>
                  <span
                    className={`text-xs font-medium flex-shrink-0 ${
                      isPrivate ? 'text-orange-500' : 'text-primary-500'
                    }`}>
                    {typeLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{listing.address}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm font-semibold text-primary-600">
                    {listing.price.toLocaleString()} {listing.currency}
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {listing.rooms && (
                      <span>
                        {listing.rooms} {t('rooms')}
                      </span>
                    )}
                    {listing.area && <span>{listing.area} м²</span>}
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={listingUrl}
                className="px-4 py-2 rounded-lg bg-surface-secondary text-foreground font-medium hover:bg-subtle transition text-sm"
                prefetch={true}>
                {t('view')}
              </Link>
              {listing.latitude && listing.longitude && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMapModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.info('Book & Pay functionality not implemented in demo');
                }}
                className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition text-sm">
                {t('bookAndPay')}
              </button>
              <button
                type="button"
                onClick={toggleSaved}
                disabled={toggleSavedMutation.isPending}
                className="w-9 h-9 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition z-10 border border-white/20 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isSavedState ? 'Remove from saved' : 'Save listing'}
                title={isSavedState ? 'Видалити з улюблених' : 'Додати до улюблених'}>
                <svg
                  className={`w-5 h-5 ${isSavedState ? 'fill-red-500 text-red-500' : 'text-white'}`}
                  fill={isSavedState ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Map Modal */}
        {showMapModal && listing.latitude && listing.longitude && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMapModal(false)}>
            <div
              className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] m-4 flex flex-col z-[10000]"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-subtle">
                <h3 className="text-lg font-semibold text-foreground">{listing.title}</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="w-8 h-8 rounded-lg bg-surface-secondary hover:bg-subtle flex items-center justify-center text-foreground transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 relative">
                <MapView
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  zoom={15}
                  markers={[
                    {
                      id: listing.id,
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                      title: listing.title,
                      address: listing.address,
                      price: listing.price,
                      currency: listing.currency,
                      images: listing.images,
                    },
                  ]}
                  onMarkerClick={(marker) => {
                    window.location.href = listingUrl;
                  }}
                />
              </div>
              <div className="p-4 border-t border-subtle bg-surface-secondary">
                <p className="text-sm text-muted-foreground mb-2">{listing.address}</p>
                <p className="text-sm font-semibold text-foreground">
                  {listing.price.toLocaleString()} {listing.currency}
                  {listing.area && ` • ${listing.area} m²`}
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Link href={listingUrl} prefetch={true}>
        <div className="bg-surface rounded-xl border border-subtle overflow-hidden hover:border-primary-400 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
          {/* Image section */}
          <div className="relative w-full h-48 bg-surface-secondary">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading={priority ? 'eager' : 'lazy'}
                priority={priority}
                quality={80}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-sm">{t('noImages')}</span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleSaved}
              disabled={toggleSavedMutation.isPending}
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition z-20 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSavedState ? 'Remove from saved' : 'Save listing'}
              title={isSavedState ? 'Видалити з улюблених' : 'Додати до улюблених'}>
              <svg
                className={`w-5 h-5 ${isSavedState ? 'fill-red-500 text-red-500' : 'text-white'}`}
                fill={isSavedState ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            <div className="absolute top-3 right-3 flex gap-2">
              {listing.latitude && listing.longitude && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMapModal(true);
                  }}
                  className="px-2 py-1 rounded-md text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 transition z-20"
                  title="View on map">
                  <svg
                    className="w-4 h-4 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium text-white ${
                  isPrivate ? 'bg-orange-600' : 'bg-primary-600'
                }`}>
                {typeLabel}
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2 min-h-[3rem]">
              {listing.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{listing.address}</p>

            <div className="mt-auto">
              <p className="text-lg font-bold text-primary-600 mb-2">
                {listing.price.toLocaleString()} {listing.currency}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {listing.rooms && (
                  <span>
                    {listing.rooms} {t('rooms')}
                  </span>
                )}
                {listing.rooms && listing.area && <span>•</span>}
                {listing.area && <span>{listing.area} м²</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Map Modal */}
      {mounted &&
        showMapModal &&
        listing.latitude &&
        listing.longitude &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMapModal(false)}>
            <div
              className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] m-4 flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-subtle">
                <h3 className="text-lg font-semibold text-foreground">{listing.title}</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="w-8 h-8 rounded-lg bg-surface-secondary hover:bg-subtle flex items-center justify-center text-foreground transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 relative">
                <MapView
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  zoom={15}
                  markers={[
                    {
                      id: listing.id,
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                      title: listing.title,
                      address: listing.address,
                      price: listing.price,
                      currency: listing.currency,
                      images: listing.images,
                    },
                  ]}
                  onMarkerClick={(marker) => {
                    window.location.href = listingUrl;
                  }}
                />
              </div>
              <div className="p-4 border-t border-subtle bg-surface-secondary">
                <p className="text-sm text-muted-foreground mb-2">{listing.address}</p>
                <p className="text-sm font-semibold text-foreground">
                  {listing.price.toLocaleString()} {listing.currency}
                  {listing.area && ` • ${listing.area} m²`}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// Мемоізуємо компонент для запобігання непотрібних ре-рендерів
export const ListingCard = memo(ListingCardComponent, (prevProps, nextProps) => {
  // Кастомна функція порівняння для оптимізації
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.variant === nextProps.variant &&
    prevProps.listing.images?.[0] === nextProps.listing.images?.[0]
  );
});
