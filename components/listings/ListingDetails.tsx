'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { SaveListingButton } from './SaveListingButton'
import { ContactForm } from './ContactForm'
import { ReviewsSection } from './ReviewsSection'
import { MapView } from '@/components/map/MapView'

interface ListingDetailsProps {
  listing: {
    id: string
    title: string
    description: string
    type: string
    category: string
    price: number
    currency: string
    address: string
    latitude?: number
    longitude?: number
    area?: number
    rooms?: number
    images: string[]
    amenities: string[]
    availableFrom?: string
    availableTo?: string
    views: number
    createdAt: string
    owner: {
      id: string
      name?: string
      email: string
      phone?: string
      avatar?: string
    }
    reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      user: {
        id: string;
        name?: string | null;
        email: string;
      };
      createdAt: string;
    }>
  }
}

export function ListingDetails({ listing }: ListingDetailsProps) {
  const { data: session } = useSession()
  const [selectedImage, setSelectedImage] = useState(0)

  const typeLabel = listing.type === 'RENT' ? 'Оренда' : 'Продаж'
  const categoryLabels: Record<string, string> = {
    APARTMENT: 'Квартира',
    HOUSE: 'Будинок',
    COMMERCIAL: 'Комерція',
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="relative h-96 w-full">
              {listing.images && listing.images.length > 0 ? (
                <>
                  <Image
                    src={listing.images[selectedImage]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority={selectedImage === 0}
                    quality={85}
                  />
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {listing.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-2 h-2 rounded-full ${
                            selectedImage === idx ? 'bg-white' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Немає зображень</span>
                </div>
              )}
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-4">
                {listing.images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-20 rounded overflow-hidden ${
                      selectedImage === idx ? 'ring-2 ring-primary-600' : ''
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${listing.title} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 16vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded text-sm">
                    {typeLabel}
                  </span>
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                    {categoryLabels[listing.category] || listing.category}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                <p className="text-2xl font-bold text-primary-600 mb-2">
                  {listing.price.toLocaleString()} {listing.currency}
                </p>
                <p className="text-gray-600">{listing.address}</p>
              </div>
              {session && <SaveListingButton listingId={listing.id} />}
            </div>

            <div className="border-t pt-4 mb-4">
              <h2 className="text-xl font-semibold mb-3">Опис</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-xl font-semibold mb-3">Характеристики</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.area && (
                  <div>
                    <span className="text-gray-600">Площа</span>
                    <p className="font-semibold">{listing.area} м²</p>
                  </div>
                )}
                {listing.rooms && (
                  <div>
                    <span className="text-gray-600">Кімнати</span>
                    <p className="font-semibold">{listing.rooms}</p>
                  </div>
                )}
                {listing.availableFrom && (
                  <div>
                    <span className="text-gray-600">Доступно з</span>
                    <p className="font-semibold">
                      {new Date(listing.availableFrom).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Переглядів</span>
                  <p className="font-semibold">{listing.views}</p>
                </div>
              </div>

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Зручності</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="bg-primary-50 text-primary-700 px-3 py-1 rounded text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {listing.latitude && listing.longitude && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Розташування</h2>
              <div className="h-96 rounded overflow-hidden">
                <MapView
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  markers={[
                    {
                      id: listing.id,
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                      title: listing.title,
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {listing.reviews && <ReviewsSection listingId={listing.id} reviews={listing.reviews} />}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Контактна інформація</h2>
            <div className="mb-4">
              {listing.owner.avatar && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3">
                  <Image
                    src={listing.owner.avatar}
                    alt={listing.owner.name || 'Owner'}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <p className="font-semibold text-lg">
                {listing.owner.name || 'Власник'}
              </p>
              {listing.owner.phone && (
                <p className="text-gray-600">{listing.owner.phone}</p>
              )}
              <p className="text-gray-600 text-sm">{listing.owner.email}</p>
            </div>

            {session && session.user.id !== listing.owner.id && (
              <ContactForm listingId={listing.id} ownerId={listing.owner.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}






