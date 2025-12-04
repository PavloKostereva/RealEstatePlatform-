'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface MyListingsProps {
  userId: string
}

interface Listing {
  id: string;
  title: string;
  price: number;
  currency?: string;
  address: string;
  status: string;
  type?: string;
  images?: string[];
}

export function MyListings({ userId }: MyListingsProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [userId])

  const fetchListings = async () => {
    try {
      const res = await fetch(`/api/listings/user/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити це оголошення?')) return

    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setListings(listings.filter((l) => l.id !== id))
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Мої оголошення</h2>
        <Link
          href="/my-listings"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          Створити оголошення
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          У вас поки що немає оголошень
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              <Link href={`/listings/${listing.id}`}>
                <div className="relative h-48 w-full">
                  {listing.images?.[0] ? (
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Немає фото</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm">
                    {listing.type === 'RENT' ? 'Оренда' : 'Продаж'}
                  </div>
                  <div className="absolute top-2 left-2 bg-white text-gray-700 px-2 py-1 rounded text-sm">
                    {listing.status === 'PUBLISHED' ? 'Опубліковано' : 
                     listing.status === 'PENDING_REVIEW' ? 'На модерації' :
                     listing.status === 'DRAFT' ? 'Чернетка' : 'Архів'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{listing.title}</h3>
                  <p className="text-primary-600 font-bold mb-2">
                    {listing.price.toLocaleString()} {listing.currency || 'UAH'}
                  </p>
                  <p className="text-gray-600 text-sm">{listing.address}</p>
                </div>
              </Link>
              <div className="p-4 pt-0 flex gap-2">
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-center"
                >
                  Редагувати
                </Link>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




