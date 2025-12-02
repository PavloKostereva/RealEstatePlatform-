'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number;
  currency: string;
  owner: {
    name?: string;
    email: string;
  };
  createdAt: string;
  images: string[];
}

export function AdminListingsList() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/listings' : `/api/admin/listings?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        setListings(listings.map((l) => (l.id === id ? { ...l, status: 'PUBLISHED' } : l)));
      }
    } catch (error) {
      console.error('Error approving listing:', error);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете відхилити це оголошення?')) return;

    try {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        setListings(listings.map((l) => (l.id === id ? { ...l, status: 'ARCHIVED' } : l)));
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Оголошення</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="all">Всі</option>
          <option value="PENDING_REVIEW">На модерації</option>
          <option value="PUBLISHED">Опубліковані</option>
          <option value="DRAFT">Чернетки</option>
          <option value="ARCHIVED">Відхилені</option>
        </select>
      </div>

      <div className="space-y-4">
        {listings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Оголошень не знайдено</p>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex gap-4">
                {listing.images?.[0] && (
                  <Link href={`/listings/${listing.id}`}>
                    <div className="relative w-32 h-32 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                  </Link>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        href={`/listings/${listing.id}`}
                        className="text-lg font-semibold hover:text-primary-600 transition">
                        {listing.title}
                      </Link>
                      <p className="text-primary-600 font-bold">
                        {listing.price.toLocaleString()} {listing.currency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          listing.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : listing.status === 'PENDING_REVIEW'
                            ? 'bg-yellow-100 text-yellow-700'
                            : listing.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        {listing.status === 'PUBLISHED'
                          ? 'Опубліковано'
                          : listing.status === 'PENDING_REVIEW'
                          ? 'На модерації'
                          : listing.status === 'DRAFT'
                          ? 'Чернетка'
                          : 'Відхилено'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Власник: {listing.owner.name || listing.owner.email}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(listing.createdAt).toLocaleDateString('uk-UA')}
                  </p>
                  <div className="mt-4 flex gap-2">
                    {listing.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
                          Підтвердити
                        </button>
                        <button
                          onClick={() => handleReject(listing.id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm">
                          Відхилити
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm">
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
