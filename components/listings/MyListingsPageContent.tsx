'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ListingLocationPicker } from './ListingLocationPicker';

interface MyListingsPageContentProps {
  userId?: string;
}

const featuresOptions = [
  'Climate controlled',
  '24/7 access',
  'Lockers',
  'Cold storage',
  'Insurance available',
  'Secure facility',
  'Parking',
  'Heating',
  'Internet',
  'Air Conditioning',
];

interface Listing {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  rooms?: number | null;
  images?: string[];
  amenities?: string[];
  status?: string;
  createdAt: string;
}

export function MyListingsPageContent({ userId }: MyListingsPageContentProps) {
  const locale = useLocale();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    size: '',
    features: [] as string[],
    address: '',
    latitude: '37.7749',
    longitude: '-122.4194',
  });
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/listings/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(newFiles);

    const readers = newFiles.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((previews) => setImages(previews));
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  // Функція для отримання адреси за координатами (reverse geocoding)
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Використовуємо Nominatim API (OpenStreetMap) для reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RealEstateApp/1.0', // Nominatim вимагає User-Agent
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Формуємо адресу з доступних компонентів
        const addressParts = [];
        
        if (addr.road || addr.street) {
          addressParts.push(addr.road || addr.street);
        }
        if (addr.house_number) {
          addressParts.push(addr.house_number);
        }
        if (addr.city || addr.town || addr.village) {
          addressParts.push(addr.city || addr.town || addr.village);
        }
        if (addr.country) {
          addressParts.push(addr.country);
        }
        
        return addressParts.length > 0 ? addressParts.join(', ') : data.display_name || '';
      }
      
      return data.display_name || '';
    } catch (error) {
      console.error('Error fetching address:', error);
      return '';
    }
  };

  const handleLocationChange = async (coords: { lat: number; lng: number }) => {
    setLocation(coords);
    setFormData((prev) => ({
      ...prev,
      latitude: coords.lat.toString(),
      longitude: coords.lng.toString(),
    }));

    // Отримуємо адресу за координатами
    const address = await getAddressFromCoordinates(coords.lat, coords.lng);
    if (address) {
      setFormData((prev) => ({
        ...prev,
        address: address,
      }));
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          handleLocationChange(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Не вдалося отримати ваше місцезнаходження');
        },
      );
    } else {
      alert('Геолокація не підтримується вашим браузером');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert('Будь ласка, увійдіть в систему, щоб створити оголошення');
      return;
    }

    setSubmitting(true);

    try {
      const uploadedImages: string[] = [];
      if (imageFiles.length > 0) {
        const imageFormData = new FormData();
        imageFiles.forEach((file) => {
          imageFormData.append('images', file);
        });

        const imageRes = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });

        if (imageRes.ok) {
          const imageData = await imageRes.json();
          uploadedImages.push(...imageData.urls);
        }
      }

      const listingData = {
        title: formData.title,
        description: formData.subtitle,
        type: 'RENT',
        category: 'COMMERCIAL',
        price: parseFloat(formData.price),
        currency: 'EUR',
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        area: parseFloat(formData.size),
        rooms: null,
        amenities: formData.features,
        images: uploadedImages,
        status: 'PENDING_REVIEW',
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      if (res.ok) {
        alert('Оголошення створено успішно!');
        setFormData({
          title: '',
          subtitle: '',
          price: '',
          size: '',
          features: [],
          address: '',
          latitude: '37.7749',
          longitude: '-122.4194',
        });
        setImages([]);
        setImageFiles([]);
        setLocation({ lat: 37.7749, lng: -122.4194 });
        fetchListings();
      } else {
        const error = await res.json();
        alert(error.error || 'Помилка при створенні оголошення');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Помилка при створенні оголошення');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це оголошення?')) return;

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setListings(listings.filter((l) => l.id !== id));
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const visibleFeatures = showMoreFeatures ? featuresOptions : featuresOptions.slice(0, 6);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      PUBLISHED: { text: 'Опубліковано', color: 'bg-green-500' },
      APPROVED: { text: 'Approved', color: 'bg-green-500' },
      PENDING_REVIEW: { text: 'На модерації', color: 'bg-yellow-500' },
      DRAFT: { text: 'Чернетка', color: 'bg-gray-500' },
      ARCHIVED: { text: 'Архів', color: 'bg-gray-500' },
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-500' };
    return (
      <span className={`${statusInfo.color} text-white px-3 py-1 rounded-full text-xs font-medium`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Section: Add a storage listing */}
      <div className="bg-surface rounded-2xl border border-subtle p-6 lg:p-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Add a storage listing
          </h1>
          <p className="text-muted-foreground">
            Fill the details below. Pricing is monthly and will auto-convert.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter listing title"
              className="w-full px-4 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subtitle</label>
            <textarea
              required
              rows={3}
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Enter listing description"
              className="w-full px-4 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monthly price (EUR)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Size (m²)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Features</label>
            <div className="flex flex-wrap gap-2">
              {visibleFeatures.map((feature) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    formData.features.includes(feature)
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-secondary text-muted-foreground border border-subtle hover:border-primary-400'
                  }`}>
                  {feature}
                </button>
              ))}
              {!showMoreFeatures && (
                <button
                  type="button"
                  onClick={() => setShowMoreFeatures(true)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-surface-secondary text-muted-foreground border border-subtle hover:border-primary-400 flex items-center gap-1">
                  See more <span className="text-xs">▼</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Upload images</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="px-4 py-2 rounded-xl bg-surface-secondary border border-subtle hover:border-primary-400 cursor-pointer flex items-center gap-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-muted-foreground">
                  {images.length}/10 photos (max 25MB each)
                </span>
              </div>
              <p className="text-xs text-primary-500">
                You can select multiple photos at once or drag & drop them here
              </p>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg overflow-hidden border border-subtle">
                      <div className="relative h-24 w-full">
                        <Image
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 150px"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Location</label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => {
                      setFormData({ ...formData, latitude: e.target.value });
                      if (e.target.value) {
                        setLocation({ lat: parseFloat(e.target.value), lng: location.lng });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => {
                      setFormData({ ...formData, longitude: e.target.value });
                      if (e.target.value) {
                        setLocation({ lat: location.lat, lng: parseFloat(e.target.value) });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-surface-secondary border border-subtle hover:border-primary-400 text-sm flex items-center gap-2">
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
                  Select Location on Map
                </button>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-4 py-2 rounded-xl bg-surface-secondary border border-subtle hover:border-primary-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Use My Location
                </button>
              </div>
              <div className="mt-3">
                <ListingLocationPicker value={location} onChange={handleLocationChange} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-lg hover:bg-primary-700 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Створення...
              </span>
            ) : (
              'Add a storage listing'
            )}
          </button>
        </form>
      </div>

      {/* Right Section: Your latest listings */}
      <div className="bg-surface rounded-2xl border border-subtle p-6 lg:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Your latest listings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your storage listings and import from Excel
          </p>
        </div>

        {/* Excel Import Section */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-surface-secondary to-surface border border-subtle shadow-sm">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="https://example.com/your-file.xlsx"
              className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
            />
            <div className="flex gap-3">
              <label className="px-4 py-2 rounded-xl bg-surface-secondary border border-subtle hover:border-primary-400 hover:bg-surface cursor-pointer text-sm flex-1 text-center transition-all">
                Select Excel File
                <input type="file" accept=".xlsx,.xls" className="hidden" />
              </label>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 text-sm shadow-sm hover:shadow-md transition-all transform hover:scale-105">
                Import from Excel (add 15%)
              </button>
            </div>
          </div>
        </div>

        {/* Listings List */}
        {!userId ? (
          <div className="p-8 rounded-xl bg-gradient-to-br from-surface-secondary to-surface border border-subtle text-center shadow-sm">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-primary-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground mb-6 text-lg">
              Увійдіть в систему, щоб переглянути свої оголошення
            </p>
            <Link
              href={`/${locale}/how-it-works`}
              className="inline-block px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
              Увійти
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">У вас поки що немає оголошень</p>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-surface-secondary border border-subtle hover:border-primary-400 hover:shadow-md transition-all transform hover:scale-[1.01]">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-subtle flex-shrink-0">
                  {listing.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium truncate">{listing.title}</h3>
                    {getStatusBadge(listing.status || 'DRAFT')}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {listing.price?.toLocaleString()} {listing.currency} • {listing.area} m²
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="p-2 rounded-lg bg-surface border border-subtle hover:border-primary-400 transition"
                      title="Редагувати">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-2 rounded-lg bg-surface border border-subtle hover:border-red-400 transition"
                      title="Видалити">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-surface border border-subtle hover:border-primary-400 transition text-xs">
                      Edit image
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
