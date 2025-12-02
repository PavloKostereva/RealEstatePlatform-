'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const amenitiesOptions = [
  'Опалення',
  'Паркінг',
  'Інтернет',
  'Кондиціонер',
  'Балкон',
  'Ліфт',
  'Охорона',
  'Пральня',
  'Меблі',
  'Техніка',
]

interface Listing {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  category?: string;
  price?: number;
  currency?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  rooms?: number | null;
  images?: string[];
  amenities?: string[];
  availableFrom?: string | null;
  availableTo?: string | null;
  status?: string;
}

interface EditListingFormProps {
  listing: Listing;
}

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(listing.images || [])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    title: listing.title || '',
    description: listing.description || '',
    type: listing.type || 'RENT',
    category: listing.category || 'APARTMENT',
    price: listing.price?.toString() || '',
    currency: listing.currency || 'UAH',
    address: listing.address || '',
    latitude: listing.latitude?.toString() || '',
    longitude: listing.longitude?.toString() || '',
    area: listing.area?.toString() || '',
    rooms: listing.rooms?.toString() || '',
    amenities: listing.amenities || [],
    availableFrom: listing.availableFrom
      ? new Date(listing.availableFrom).toISOString().split('T')[0]
      : '',
    availableTo: listing.availableTo
      ? new Date(listing.availableTo).toISOString().split('T')[0]
      : '',
    status: listing.status || 'DRAFT',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newFiles = [...imageFiles, ...files].slice(0, 10 - images.length)
    setImageFiles([...imageFiles, ...newFiles])

    newFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    if (index < listing.images?.length) {
      // Existing image - will be removed on save
      setImages(images.filter((_, i) => i !== index))
    } else {
      // New image
      const newIndex = index - (listing.images?.length || 0)
      const newFiles = imageFiles.filter((_, i) => i !== newIndex)
      const newImages = images.filter((_, i) => i !== index)
      setImageFiles(newFiles)
      setImages(newImages)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload new images
      const uploadedImages: string[] = []
      if (imageFiles.length > 0) {
        const imageFormData = new FormData()
        imageFiles.forEach((file) => {
          imageFormData.append('images', file)
        })

        const imageRes = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        })

        if (imageRes.ok) {
          const imageData = await imageRes.json()
          uploadedImages.push(...imageData.urls)
        }
      }

      // Combine existing and new images
      const allImages = [...images, ...uploadedImages]

      // Update listing
      const listingData = {
        ...formData,
        price: parseFloat(formData.price),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        availableFrom: formData.availableFrom || null,
        availableTo: formData.availableTo || null,
        images: allImages,
      }

      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      })

      if (res.ok) {
        router.push(`/listings/${listing.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Помилка оновлення оголошення')
      }
    } catch (error) {
      console.error('Error updating listing:', error)
      alert('Помилка оновлення оголошення')
    } finally {
      setLoading(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter((a) => a !== amenity)
        : [...formData.amenities, amenity],
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Редагувати оголошення</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Заголовок *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Опис *</label>
          <textarea
            required
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Тип *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="RENT">Оренда</option>
              <option value="SALE">Продаж</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Категорія *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="APARTMENT">Квартира</option>
              <option value="HOUSE">Будинок</option>
              <option value="COMMERCIAL">Комерція</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ціна *</label>
            <input
              type="number"
              required
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Валюта</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="UAH">UAH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Кімнати</label>
            <input
              type="number"
              min="1"
              value={formData.rooms}
              onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Площа (м²)</label>
            <input
              type="number"
              min="0"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Адреса *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Широта</label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Довгота</label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Доступно з</label>
            <input
              type="date"
              value={formData.availableFrom}
              onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Доступно до</label>
            <input
              type="date"
              value={formData.availableTo}
              onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Зручності</label>
          <div className="flex flex-wrap gap-2">
            {amenitiesOptions.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  formData.amenities.includes(amenity)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Зображення (до 10 шт.)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <div className="relative w-full h-24 rounded overflow-hidden">
                    <Image
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 25vw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Статус</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="DRAFT">Чернетка</option>
            <option value="PENDING_REVIEW">На модерацію</option>
            <option value="PUBLISHED">Опубліковано</option>
            <option value="ARCHIVED">Архів</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
          >
            {loading ? 'Оновлення...' : 'Зберегти зміни'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Скасувати
          </button>
        </div>
      </form>
    </div>
  )
}






