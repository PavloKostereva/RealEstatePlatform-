'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const L = typeof window !== 'undefined' ? require('leaflet') : null;

interface ListingLocationPickerProps {
  value: { lat: number | null; lng: number | null };
  onChange: (value: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [54.5, 15.0];
const DEFAULT_ZOOM = 4;

// Функція для безпечної перевірки готовності карти
const isMapReady = (map: any): boolean => {
  if (!map) return false;
  try {
    const mapInstance = map as any;
    if (
      !mapInstance._loaded ||
      !mapInstance._container ||
      !mapInstance._panes ||
      !mapInstance._mapPane
    ) {
      return false;
    }
    const mapPane = mapInstance._mapPane;
    return !!(mapPane && mapPane._leaflet_pos);
  } catch {
    return false;
  }
};

export function ListingLocationPicker({ value, onChange }: ListingLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const onChangeRef = useRef(onChange);

  // Оновлюємо ref при зміні onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Створюємо карту тільки один раз при монтуванні
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current || mapRef.current || !L) return;

    // Налаштування іконок Leaflet (виправляє проблему з відсутністю маркерів)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const initialCenter = value.lat && value.lng ? [value.lat, value.lng] : DEFAULT_CENTER;
    const initialZoom = value.lat && value.lng ? 12 : DEFAULT_ZOOM;

    mapRef.current = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
    });

    // Use OpenStreetMap tiles
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Обробник кліку на карту
    const handleClick = (event: any) => {
      if (!mapRef.current || !isMapReady(mapRef.current)) return;

      const { lat, lng } = event.latlng;
      const latLng = L.latLng(lat, lng);

      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng, {
          draggable: true,
        })
          .addTo(mapRef.current)
          .on('moveend', (e: any) => {
            const newLatLng = (e.target as any).getLatLng();
            onChangeRef.current({ lat: newLatLng.lat, lng: newLatLng.lng });
          });
      }
      onChangeRef.current({ lat, lng });
    };

    mapRef.current.on('click', handleClick);

    // Ініціалізація після готовності карти
    mapRef.current.whenReady(() => {
      if (!mapRef.current) return;

      // Затримка для invalidateSize
      setTimeout(() => {
        if (mapRef.current && isMapReady(mapRef.current)) {
          try {
            mapRef.current.invalidateSize();
          } catch (error) {
            console.warn('Error invalidating size:', error);
          }
        }
      }, 100);

      // Додаємо маркер, якщо є початкові координати
      if (value.lat && value.lng) {
        setTimeout(() => {
          if (!mapRef.current || !isMapReady(mapRef.current)) return;

          try {
            const latLng = L.latLng(value.lat, value.lng);
            if (!markerRef.current) {
              markerRef.current = L.marker(latLng, { draggable: true })
                .addTo(mapRef.current)
                .on('moveend', (e: any) => {
                  const newLatLng = (e.target as any).getLatLng();
                  onChangeRef.current({ lat: newLatLng.lat, lng: newLatLng.lng });
                });
            } else {
              markerRef.current.setLatLng(latLng);
            }
          } catch (error) {
            console.warn('Error adding initial marker:', error);
          }
        }, 200);
      }

      // Remove "Leaflet |" from attribution text
      const removeLeaflet = () => {
        const attributionControl = document.querySelector('.leaflet-control-attribution');
        if (attributionControl) {
          let text = attributionControl.innerHTML;
          text = text.replace(/Leaflet\s*\|\s*/gi, '');
          text = text.replace(/Powered by\s+Leaflet\s*\|\s*/gi, '');
          text = text.replace(/^Leaflet\s*/gi, '');
          if (attributionControl.innerHTML !== text) {
            attributionControl.innerHTML = text;
          }
        }
      };

      setTimeout(removeLeaflet, 50);
      setTimeout(removeLeaflet, 200);
      setTimeout(removeLeaflet, 500);

      const observer = new MutationObserver(removeLeaflet);
      const attributionControl = document.querySelector('.leaflet-control-attribution');
      if (attributionControl) {
        observer.observe(attributionControl, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    });

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.off('click', handleClick);
          if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
          }
          mapRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isMounted]); // Тільки isMounted, без value.lat/value.lng

  // Оновлюємо маркер при зміні value (але не перестворюємо карту)
  useEffect(() => {
    if (!mapRef.current || !isMounted || !L) return;
    if (!isMapReady(mapRef.current)) return;

    const updateMarker = () => {
      if (!mapRef.current || !isMapReady(mapRef.current)) return;

      try {
        if (value.lat && value.lng) {
          const latLng = L.latLng(value.lat, value.lng);

          if (markerRef.current) {
            // Оновлюємо позицію існуючого маркера
            markerRef.current.setLatLng(latLng);
          } else {
            // Створюємо новий маркер
            markerRef.current = L.marker(latLng, { draggable: true })
              .addTo(mapRef.current)
              .on('moveend', (e: any) => {
                const newLatLng = (e.target as any).getLatLng();
                onChangeRef.current({ lat: newLatLng.lat, lng: newLatLng.lng });
              });
          }

          // Плавно переміщуємо карту до маркера
          mapRef.current.setView(latLng, 13, { animate: true, duration: 0.5 });
        } else {
          // Якщо координат немає, видаляємо маркер
          if (markerRef.current && mapRef.current) {
            mapRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
          }
        }
      } catch (error) {
        console.warn('Error updating marker:', error);
      }
    };

    // Затримка для уникнення конфліктів
    const timeoutId = setTimeout(updateMarker, 150);
    return () => clearTimeout(timeoutId);
  }, [value.lat, value.lng, isMounted]);

  if (!isMounted) {
    return (
      <div className="rounded-xl overflow-hidden border border-subtle">
        <div className="h-72 w-full bg-surface-secondary flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-subtle">
      <div ref={mapContainerRef} className="h-72 w-full" />
    </div>
  );
}
