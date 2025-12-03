'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ListingLocationPicker } from './ListingLocationPicker';

const amenitiesOptions = [
  'Heating',
  'Parking',
  'Internet',
  'Air Conditioning',
  'Balcony',
  'Elevator',
  'Security',
  'Laundry',
  'Furnished',
  'Appliances',
];

export function CreateListingForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('listingForm');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'RENT',
    category: 'APARTMENT',
    price: '',
    currency: 'USD',
    address: '',
    area: '',
    rooms: '',
    amenities: [] as string[],
    availableFrom: '',
    availableTo: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.lat || !location.lng) {
      alert(t('errors.locationRequired'));
      return;
    }

    setLoading(true);

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
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        latitude: location.lat,
        longitude: location.lng,
        area: formData.area ? parseFloat(formData.area) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        availableFrom: formData.availableFrom || null,
        availableTo: formData.availableTo || null,
        images: uploadedImages,
        status: 'PENDING_REVIEW',
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });

      if (res.ok) {
        alert(t('success.pending'));
        router.push(`/${locale}/listings`);
      } else {
        const error = await res.json();
        alert(error.error || t('errors.generic'));
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-2xl border border-subtle shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('fields.title')}</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('placeholders.title')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('fields.description')}</label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('placeholders.description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="RENT">{t('options.type.rent')}</option>
                  <option value="SALE">{t('options.type.sale')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="APARTMENT">{t('options.category.apartment')}</option>
                  <option value="HOUSE">{t('options.category.house')}</option>
                  <option value="COMMERCIAL">{t('options.category.commercial')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.price')}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.currency')}</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="UAH">UAH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.rooms')}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.rooms}
                  onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.area')}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.address')}</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('placeholders.address')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('fields.availableFrom')}
                </label>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('fields.availableTo')}</label>
                <input
                  type="date"
                  value={formData.availableTo}
                  onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('fields.location')}</label>
              <p className="text-xs text-muted-foreground mb-3">{t('helpers.location')}</p>
              <ListingLocationPicker value={location} onChange={(coords) => setLocation(coords)} />
              {location.lat && location.lng && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t('helpers.coordinates', {
                    lat: location.lat.toFixed(6),
                    lng: location.lng.toFixed(6),
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('fields.amenities')}</label>
              <div className="flex flex-wrap gap-2">
                {amenitiesOptions.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1.5 rounded-xl text-sm border transition ${
                      formData.amenities.includes(amenity)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-surface-secondary text-muted-foreground border-subtle hover:border-primary-400'
                    }`}>
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('fields.images')}</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden border border-subtle">
                      <div className="relative h-28 w-full">
                        <Image
                          src={img}
                          alt={`Preview ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-4 border-t border-subtle">
          <p className="text-sm text-muted-foreground">{t('helpers.review')}</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 rounded-xl border border-subtle bg-surface-secondary text-muted-foreground hover:border-primary-400">
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-50">
              {loading ? t('actions.creating') : t('actions.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
