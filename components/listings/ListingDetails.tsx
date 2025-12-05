'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { SaveListingButton } from './SaveListingButton';
import { ContactForm } from './ContactForm';
import { ReviewsSection } from './ReviewsSection';
import { CheckoutModal } from './CheckoutModal';
import dynamic from 'next/dynamic';

// Dynamically import MapView to avoid SSR issues with Leaflet
const MapView = dynamic(
  () => import('@/components/map/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
  },
);

interface ListingDetailsProps {
  listing: {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    price: number;
    currency: string;
    address: string;
    latitude?: number;
    longitude?: number;
    area?: number;
    rooms?: number;
    images: string[];
    amenities: string[];
    availableFrom?: string;
    availableTo?: string;
    views: number;
    createdAt: string;
    owner: {
      id: string;
      name?: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
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
    }>;
  };
}

export function ListingDetails({ listing }: ListingDetailsProps) {
  const { data: session } = useSession();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const typeLabel = listing.type === 'RENT' ? 'Оренда' : 'Продаж';
  const categoryLabels: Record<string, string> = {
    APARTMENT: 'Квартира',
    HOUSE: 'Будинок',
    COMMERCIAL: 'Комерція',
    STORAGE: 'Self-storage',
  };

  const avgRating =
    listing.reviews && listing.reviews.length > 0
      ? listing.reviews.reduce((sum, r) => sum + r.rating, 0) / listing.reviews.length
      : 0;

  const reviewsCount = listing.reviews?.length || 0;

  // Calculate price per month
  const pricePerMonth = listing.price;

  // Keyboard navigation for image modal
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      } else if (e.key === 'ArrowLeft' && listing.images && listing.images.length > 0) {
        setModalImageIndex(modalImageIndex > 0 ? modalImageIndex - 1 : listing.images.length - 1);
      } else if (e.key === 'ArrowRight' && listing.images && listing.images.length > 0) {
        setModalImageIndex(modalImageIndex < listing.images.length - 1 ? modalImageIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, modalImageIndex, listing.images]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-surface rounded-2xl border border-subtle overflow-hidden shadow-lg">
            <div
              className="relative h-[500px] w-full cursor-pointer"
              onClick={() => {
                if (listing.images && listing.images.length > 0) {
                  setModalImageIndex(selectedImage);
                  setIsImageModalOpen(true);
                }
              }}>
              {listing.images && listing.images.length > 0 ? (
                <>
                  <Image
                    src={listing.images[selectedImage]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority={selectedImage === 0}
                    quality={90}
                  />
                  {listing.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(
                            selectedImage > 0 ? selectedImage - 1 : listing.images.length - 1,
                          );
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10 cursor-pointer">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(
                            selectedImage < listing.images.length - 1 ? selectedImage + 1 : 0,
                          );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-10 cursor-pointer">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {listing.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`w-2 h-2 rounded-full transition ${
                              selectedImage === idx ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-surface-secondary flex items-center justify-center">
                  <span className="text-muted-foreground">Немає зображень</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-4 bg-surface-secondary">
                {listing.images.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(idx);
                    }}
                    onDoubleClick={() => {
                      setModalImageIndex(idx);
                      setIsImageModalOpen(true);
                    }}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      selectedImage === idx
                        ? 'border-primary-600 ring-2 ring-primary-600/50'
                        : 'border-transparent hover:border-primary-400'
                    }`}>
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

          {/* Image Gallery Modal - Same style as ListingCard */}
          {isImageModalOpen && listing.images && listing.images.length > 0 && (
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
              onClick={() => setIsImageModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999,
              }}>
              <div
                className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}>
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Main image */}
                <div className="flex-1 relative flex items-center justify-center min-h-0 p-4">
                  {listing.images[modalImageIndex] && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={listing.images[modalImageIndex]}
                        alt={`${listing.title} - Image ${modalImageIndex + 1}`}
                        fill
                        className="object-contain"
                        sizes="90vw"
                        quality={95}
                      />
                    </div>
                  )}

                  {/* Navigation arrows */}
                  {listing.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalImageIndex(
                            modalImageIndex > 0 ? modalImageIndex - 1 : listing.images.length - 1,
                          );
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition z-10">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalImageIndex(
                            modalImageIndex < listing.images.length - 1 ? modalImageIndex + 1 : 0,
                          );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition z-10">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                    {modalImageIndex + 1} / {listing.images.length}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {listing.images.length > 1 && (
                  <div className="h-24 bg-black/40 p-2 overflow-x-auto">
                    <div className="flex gap-2 h-full justify-center">
                      {listing.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImageIndex(idx);
                          }}
                          className={`relative h-full w-24 flex-shrink-0 rounded overflow-hidden border-2 transition ${
                            modalImageIndex === idx
                              ? 'border-white scale-105'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}>
                          <Image
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Title and Basic Info */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-primary-600 text-white">
                    {typeLabel}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-surface-secondary text-foreground">
                    {categoryLabels[listing.category] || listing.category}
                  </span>
                  {listing.area && (
                    <span className="px-3 py-1 rounded-lg text-sm font-medium bg-surface-secondary text-foreground">
                      {listing.area} m²
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{listing.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {listing.address}
                  </span>
                  {avgRating > 0 && (
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="font-semibold">{avgRating.toFixed(1)}</span>
                      <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="text-muted-foreground">• {reviewsCount} reviews</span>
                    </span>
                  )}
                </div>
              </div>
              {session && (
                <div className="ml-4">
                  <SaveListingButton listingId={listing.id} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-subtle">
              <button className="text-sm text-muted-foreground hover:text-foreground transition">
                Share
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition">
                Report
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Features</h2>
            {listing.amenities && listing.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface-secondary text-foreground border border-subtle">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No features listed.</p>
            )}
          </div>

          {/* About this space */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">About this space</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {listing.description || 'Clean, secure space suitable for personal storage.'}
            </p>
          </div>

          {/* Access Section */}
          <div className="bg-surface-secondary rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-3">Access</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Daily • 24/7</p>
              <p>Appointment required before each visit</p>
            </div>
          </div>

          {/* Cancellation */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-3">Cancellation</h2>
            <p className="text-muted-foreground">
              Full refund up to 24 hours after reservation approval.
            </p>
          </div>

          {/* Vehicle restrictions */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-3">Vehicle restrictions</h2>
            <p className="text-muted-foreground">This host hasn&apos;t specified restrictions.</p>
          </div>

          {/* Policies */}
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-3">Policies</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• No living in the space.</li>
              <li>• No working in the space.</li>
            </ul>
          </div>

          {/* Hosted by */}
          <div className="bg-surface-secondary rounded-2xl border border-subtle p-6 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-4">Hosted by host</h2>
            <div className="flex items-center gap-3">
              {listing.owner.avatar && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={listing.owner.avatar}
                    alt={listing.owner.name || 'Owner'}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{listing.owner.name || 'Host'}</p>
                {avgRating > 0 && (
                  <p className="text-sm text-green-500 flex items-center gap-1">
                    <span>{avgRating.toFixed(1)}</span>
                    <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span>• {reviewsCount} reviews</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {listing.reviews && (
            <ReviewsSection
              listingId={listing.id}
              reviews={listing.reviews.map((review) => ({
                ...review,
                userId: review.user.id,
                listingId: listing.id,
              }))}
            />
          )}

          {/* Map */}
          {listing.latitude && listing.longitude && (
            <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-4">Location</h2>
              <div className="h-96 rounded-lg overflow-hidden">
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
              <Link
                href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 transition">
                Open in Maps →
              </Link>
            </div>
          )}
        </div>

        {/* Right Column - Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg sticky top-4">
            {/* Price */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-foreground mb-1">
                {pricePerMonth.toLocaleString()} {listing.currency}
              </div>
              <div className="text-muted-foreground">/ month</div>
            </div>

            {/* Calendar for Booking */}
            {session && session.user.id !== listing.owner.id && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Select date
                </label>
                <div className="bg-surface-secondary rounded-xl p-4 border border-subtle">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={
                      listing.availableFrom
                        ? new Date(listing.availableFrom).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    }
                    max={
                      listing.availableTo
                        ? new Date(listing.availableTo).toISOString().split('T')[0]
                        : undefined
                    }
                    className="w-full h-10 px-3 rounded-lg border border-subtle bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Book & Pay Button */}
            {session && session.user.id !== listing.owner.id && (
              <button
                onClick={() => {
                  if (!selectedDate) {
                    alert('Будь ласка, оберіть дату бронювання');
                    return;
                  }
                  setIsCheckoutModalOpen(true);
                }}
                disabled={!selectedDate}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl mb-6">
                Book & Pay
              </button>
            )}

            {/* Contact Form or Contact Info */}
            {session && session.user.id !== listing.owner.id ? (
              <div className="space-y-4 mb-6">
                <div className="text-center text-sm text-muted-foreground mb-4">or</div>
                <ContactForm listingId={listing.id} ownerId={listing.owner.id} />
              </div>
            ) : (
              <div className="mb-6">
                <div className="bg-surface-secondary rounded-xl p-4 border border-subtle">
                  <h3 className="font-semibold text-foreground mb-2">Contact Information</h3>
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
                  <p className="font-semibold text-foreground">{listing.owner.name || 'Owner'}</p>
                  {listing.owner.phone && (
                    <p className="text-muted-foreground text-sm">{listing.owner.phone}</p>
                  )}
                  <p className="text-muted-foreground text-sm">{listing.owner.email}</p>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-subtle space-y-3 text-sm">
              {listing.area && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span className="text-foreground font-medium">{listing.area} m²</span>
                </div>
              )}
              {listing.rooms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rooms</span>
                  <span className="text-foreground font-medium">{listing.rooms}</span>
                </div>
              )}
              {listing.availableFrom && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available from</span>
                  <span className="text-foreground font-medium">
                    {new Date(listing.availableFrom).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Listings Section - Full Width */}
      <div className="mt-8">
        <div className="bg-surface rounded-2xl border border-subtle p-6 shadow-lg">
          <h2 className="text-xl font-bold text-foreground mb-6">Similar listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Placeholder for similar listings - will be populated by parent component */}
            <div className="text-center py-8 text-muted-foreground">
              Similar listings will be displayed here
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          listing={{
            id: listing.id,
            title: listing.title,
            type: listing.type,
            category: listing.category,
            price: listing.price,
            currency: listing.currency,
            address: listing.address,
            images: listing.images,
            area: listing.area,
          }}
        />
      )}
    </div>
  );
}
