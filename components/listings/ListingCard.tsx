'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSavedListing, useToggleSaved } from '@/hooks/useSaved';
import { useToast } from '@/components/ui/ToastContainer';

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

  // Мемоізуємо обчислення
  const imageUrl = useMemo(() => listing.images?.[0] || null, [listing.images]);
  const typeLabel = useMemo(
    () => (listing.type === 'RENT' ? t('rent') : t('sale')),
    [listing.type, t],
  );
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
                <span className="text-xs font-medium text-primary-500 flex-shrink-0">
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
    );
  }

  return (
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

          <div className="absolute top-3 right-3">
            <span className="bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-medium">
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
