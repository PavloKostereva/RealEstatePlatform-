'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false, // Карта не потребує SSR
  },
);

interface Listing {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  currency: string;
  type: string;
}

export function HomeMap() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [center] = useState({ lat: 54.5, lng: 15.0 }); // Center of Europe (shifted north to show all of Europe)

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      // Для карти потрібні всі listings, тому встановлюємо великий limit
      const res = await fetch('/api/listings?status=PUBLISHED&limit=1000');
      if (res.ok) {
        const data = await res.json();
        const publishedListings = data.listings
          .filter(
            (l: {
              latitude?: number | null;
              longitude?: number | null;
              id: string;
              title: string;
              price: number;
              currency: string;
              type: string;
            }) => l.latitude && l.longitude,
          )
          .map(
            (l: {
              latitude: number;
              longitude: number;
              id: string;
              title: string;
              price: number;
              currency: string;
              type: string;
            }) => ({
              id: l.id,
              title: l.title,
              latitude: l.latitude,
              longitude: l.longitude,
              price: l.price,
              currency: l.currency,
              type: l.type,
            }),
          );
        setListings(publishedListings);

        // Don't auto-center on listings - let user control the map
        // Removed automatic center calculation to allow free navigation
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = useCallback(
    (marker: { id: string }) => {
      router.push(`/listings/${marker.id}`);
    },
    [router],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-2">Карта оголошень</h2>
        <p className="text-gray-600 text-sm">Знайдено оголошень: {listings.length}</p>
      </div>
      <div style={{ height: '400px' }}>
        <MapView
          latitude={center.lat}
          longitude={center.lng}
          markers={listings.map((l) => ({
            id: l.id,
            latitude: l.latitude,
            longitude: l.longitude,
            title: l.title,
          }))}
          onMarkerClick={handleMarkerClick}
          zoom={10}
        />
      </div>
    </div>
  );
}
