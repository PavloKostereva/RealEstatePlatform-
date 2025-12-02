'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface ListingLocationPickerProps {
  value: { lat: number | null; lng: number | null };
  onChange: (value: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [54.5, 15.0]; // Center of Europe (shifted north to show all of Europe)
const DEFAULT_ZOOM = 4;

export function ListingLocationPicker({ value, onChange }: ListingLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: value.lat && value.lng ? [value.lat, value.lng] : DEFAULT_CENTER,
      zoom: value.lat && value.lng ? 12 : DEFAULT_ZOOM,
    });

    // Use OpenStreetMap tiles
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);

    mapRef.current.whenReady(() => {
      if (!mapRef.current) return;
      
      mapRef.current.invalidateSize();
      
      // Remove "Leaflet |" from attribution text
      const removeLeaflet = () => {
        const attributionControl = document.querySelector('.leaflet-control-attribution');
        if (attributionControl) {
          let text = attributionControl.innerHTML;
          // Remove "Leaflet |" or "Leaflet" from anywhere in the text
          text = text.replace(/Leaflet\s*\|\s*/gi, '');
          text = text.replace(/Powered by\s+Leaflet\s*\|\s*/gi, '');
          text = text.replace(/^Leaflet\s*/gi, '');
          if (attributionControl.innerHTML !== text) {
            attributionControl.innerHTML = text;
          }
        }
      };
      
      // Try multiple times to ensure attribution is rendered
      setTimeout(removeLeaflet, 50);
      setTimeout(removeLeaflet, 200);
      setTimeout(removeLeaflet, 500);
      
      // Watch for changes in attribution
      const observer = new MutationObserver(removeLeaflet);
      const attributionControl = document.querySelector('.leaflet-control-attribution');
      if (attributionControl) {
        observer.observe(attributionControl, { childList: true, subtree: true, characterData: true });
      }
    });

    const handleClick = (event: L.LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng(event.latlng);
      } else {
        markerRef.current = L.marker(event.latlng, {
          draggable: true,
        })
          .addTo(mapRef.current!)
          .on('moveend', (e) => {
            const newLatLng = (e.target as L.Marker).getLatLng();
            onChange({ lat: newLatLng.lat, lng: newLatLng.lng });
          });
      }
      onChange({ lat, lng });
    };

    mapRef.current.on('click', handleClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', handleClick);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isMounted, onChange, value.lat, value.lng]);

  useEffect(() => {
    if (!mapRef.current || !isMounted) return;

    const map = mapRef.current;

    map.whenReady(() => {
      map.invalidateSize();
      if (value.lat && value.lng) {
        const latLng = L.latLng(value.lat, value.lng);
        map.setView(latLng, 13);
        if (markerRef.current) {
          markerRef.current.setLatLng(latLng);
        } else {
          markerRef.current = L.marker(latLng, { draggable: true })
            .addTo(map)
            .on('moveend', (e) => {
              const newLatLng = (e.target as L.Marker).getLatLng();
              onChange({ lat: newLatLng.lat, lng: newLatLng.lng });
            });
        }
      }
    });
  }, [value.lat, value.lng, isMounted, onChange]);

  return (
    <div className="rounded-xl overflow-hidden border border-subtle">
      <div ref={mapContainerRef} className="h-72 w-full" />
    </div>
  );
}
