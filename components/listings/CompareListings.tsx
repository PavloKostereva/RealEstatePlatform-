'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  area?: number;
  rooms?: number;
  address: string;
  images: string[];
  type: string;
  category: string;
}

export function CompareListings() {
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations('compare');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchSavedListings();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchSavedListings = async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        const savedListings: Listing[] = data.map(
          (item: {
            listing: {
              id: string;
              title: string;
              price: number;
              currency: string;
              area?: number | null;
              rooms?: number | null;
              address: string;
              images?: string[] | null;
              type: string;
              category: string;
            };
          }) => ({
            id: item.listing.id,
            title: item.listing.title,
            price: item.listing.price,
            currency: item.listing.currency,
            area: item.listing.area,
            rooms: item.listing.rooms,
            address: item.listing.address,
            images: item.listing.images || [],
            type: item.listing.type,
            category: item.listing.category,
          }),
        );
        setListings(savedListings);
      }
    } catch (error) {
      console.error('Error fetching saved listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromComparison = async (listingId: string) => {
    try {
      const res = await fetch(`/api/saved/${listingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (error) {
      console.error('Error removing listing:', error);
    }
  };

  const clearAll = async () => {
    if (!confirm(t('clearAllConfirm'))) return;

    try {
      await Promise.all(listings.map((l) => fetch(`/api/saved/${l.id}`, { method: 'DELETE' })));
      setListings([]);
    } catch (error) {
      console.error('Error clearing all:', error);
    }
  };

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">{t('signInRequired')}</p>
          <Link
            href={`/${locale}/profile`}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition">
            {t('signIn')}
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">{t('noListings')}</p>
          <Link
            href={`/${locale}/listings`}
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition">
            {t('viewMoreListings')}
          </Link>
        </div>
      </div>
    );
  }

  const prices = listings.map((l) => l.price);
  const areas = listings.filter((l) => l.area).map((l) => l.area!);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minArea = areas.length > 0 ? Math.min(...areas) : null;
  const maxArea = areas.length > 0 ? Math.max(...areas) : null;

  const categoryLabels: Record<string, string> = {
    APARTMENT: t('apartment'),
    HOUSE: t('house'),
    COMMERCIAL: t('commercial'),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle', {
              count: listings.length,
              listing: listings.length === 1 ? 'listing' : 'listings',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {t('clearAll')}
          </button>
          <Link
            href={`/${locale}/listings`}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">
            {t('viewMoreListings')}
          </Link>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-surface rounded-xl border border-subtle overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-subtle">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('listing')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('size')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('location')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('features')}
                </th>
                <th className="text-left p-4 text-sm font-semibold text-foreground uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr
                  key={listing.id}
                  className="border-b border-subtle hover:bg-surface-secondary/50 transition">
                  <td className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                        {listing.images?.[0] ? (
                          <Image
                            src={listing.images[0]}
                            alt={listing.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">{t('noImage')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-surface-secondary text-muted-foreground mb-2">
                          {categoryLabels[listing.category] || listing.category}
                        </span>
                        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryLabels[listing.category] || listing.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground font-medium">
                      {listing.price.toLocaleString()} {listing.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('perMonth')}</p>
                  </td>
                  <td className="p-4">
                    {listing.area ? (
                      <p className="text-foreground">{listing.area} m²</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">-</p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-muted-foreground"
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
                      <p className="text-sm text-foreground line-clamp-1">{listing.address}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-muted-foreground">{t('noFeatures')}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromComparison(listing.id)}
                        className="w-10 h-10 rounded-lg bg-surface-secondary hover:bg-red-500/20 flex items-center justify-center transition group"
                        aria-label={t('removeFromComparison')}>
                        <svg
                          className="w-5 h-5 text-red-500 group-hover:text-red-600"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      <Link
                        href={`/${locale}/listings/${listing.id}`}
                        className="w-10 h-10 rounded-lg bg-primary-600 hover:bg-primary-700 flex items-center justify-center transition"
                        aria-label={t('viewListing')}>
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-subtle p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t('priceRange')}
          </h3>
          <p className="text-2xl font-bold text-foreground mb-1">
            {minPrice.toLocaleString()} {listings[0]?.currency} - {maxPrice.toLocaleString()}{' '}
            {listings[0]?.currency}
          </p>
          <p className="text-sm text-muted-foreground">{t('perMonth')}</p>
        </div>

        {minArea && maxArea && (
          <div className="bg-surface rounded-xl border border-subtle p-6">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {t('sizeRange')}
            </h3>
            <p className="text-2xl font-bold text-foreground mb-1">
              {minArea} - {maxArea} m²
            </p>
            <p className="text-sm text-muted-foreground">{t('areaRange')}</p>
          </div>
        )}

        <div className="bg-surface rounded-xl border border-subtle p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {t('totalListings')}
          </h3>
          <p className="text-2xl font-bold text-foreground mb-1">{listings.length}</p>
          <p className="text-sm text-muted-foreground">{t('inComparison')}</p>
        </div>
      </div>
    </div>
  );
}
