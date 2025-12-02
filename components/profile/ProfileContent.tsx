'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { SupportChat } from './SupportChat';

const guestUser = {
  id: 'guest-user',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '+380 00 000 00 00',
  role: 'USER',
  ownerVerified: false,
  createdAt: new Date().toISOString(),
  avatar: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
  location: '',
  bio: '',
};

const guestListings = [
  {
    id: 'mock-1',
    title: 'Modern Loft in Warsaw',
    type: 'private',
    price: 3200,
    currency: 'PLN',
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Sunny Apartment in Barcelona',
    type: 'private',
    price: 870000,
    currency: 'EUR',
    status: 'published',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Lakefront Condo in Toronto',
    type: 'private',
    price: 640000,
    currency: 'CAD',
    status: 'published',
    createdAt: new Date().toISOString(),
  },
];

interface ProfileContentProps {
  userId?: string;
  isGuest?: boolean;
}

export function ProfileContent({ userId, isGuest = false }: ProfileContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', location: '', bio: '' });
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: false,
    documents: false,
    messages: false,
    support: false,
    bookings: false,
    listings: false,
    affiliate: false,
  });
  const [showSupportChat, setShowSupportChat] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const personalInfoRef = useRef<HTMLDivElement>(null);
  const documentsRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const supportRef = useRef<HTMLDivElement>(null);
  const bookingsRef = useRef<HTMLDivElement>(null);
  const listingsRef = useRef<HTMLDivElement>(null);
  const affiliateRef = useRef<HTMLDivElement>(null);

  const isOwnProfile = !isGuest && session?.user.id === userId;
  const isDemoProfile = user?.id === 'guest-user';
  const displayName = isDemoProfile ? '' : user?.name || '';
  const displayEmail = isDemoProfile ? '' : user?.email || '';
  const displayPhone = isDemoProfile ? '' : user?.phone || '';
  const displayLocation = isDemoProfile ? '' : user?.location || '';
  const displayBio = isDemoProfile ? '' : user?.bio || '';

  useEffect(() => {
    if (!userId || isGuest) {
      setUser(guestUser);
      setLoading(false);
      setListings(guestListings);
      setListingsLoading(false);
      return;
    }
    fetchUser(userId);
    fetchListings(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuest]);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const fetchUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async (id: string) => {
    try {
      const res = await fetch(`/api/listings/user/${id}`);
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      } else {
        setListings([]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

  const scrollToSection = (sectionRef?: React.RefObject<HTMLDivElement>) => {
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShare = (platform: string, code: string) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const message = `Check out my listings on RealEstate: ${shareUrl}?ref=${code}`;

    switch (platform) {
      case 'Share':
        if (navigator.share) {
          navigator
            .share({ title: 'RealEstate', text: message, url: `${shareUrl}?ref=${code}` })
            .catch(() => undefined);
        } else {
          navigator.clipboard.writeText(message);
          alert('Share link copied to clipboard');
        }
        break;
      case 'Facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
        );
        break;
      case 'Instagram':
        navigator.clipboard.writeText(message);
        alert('Message copied. Share it on Instagram!');
        break;
      case 'Telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
            message,
          )}`,
          '_blank',
        );
        break;
      case 'WhatsApp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'Email':
        window.location.href = `mailto:?subject=RealEstate referral&body=${encodeURIComponent(
          message,
        )}`;
        break;
      default:
        break;
    }
  };

  const handleSignOut = () => {
    router.push('/how-it-works?logout=true');
  };

  const handleApproveAll = async () => {
    alert('Approve all listings is not implemented in this demo.');
  };

  const handleReject = (id: string) => {
    alert(`Reject flow for listing ${id} is not implemented in this demo.`);
  };

  const toggleFeatureList = () => {
    alert('Toggle feature list is not implemented in this demo.');
  };

  const renderFeatureChip = (feature: string, idx: number) => {
    return (
      <span
        key={idx}
        className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-surface-secondary text-muted-foreground">
        {feature}
      </span>
    );
  };

  const handleEditProfile = () => {
    setEditMode(true);
    scrollToSection(personalInfoRef);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditData({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
      });
    }
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('phone', editData.phone);
      formData.append('location', editData.location);
      formData.append('bio', editData.bio);

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser((prev: any) => ({ ...prev, ...updated }));
      setEditMode(false);
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-surface rounded-3xl border border-subtle shadow-md p-10 text-center space-y-4">
        <h1 className="text-2xl font-bold">User not found</h1>
        <p className="text-muted-foreground">
          Try refreshing the page or sign in to view your dashboard.
        </p>
      </div>
    );
  }

  const accountAgeDays = user.createdAt
    ? differenceInDays(new Date(), new Date(user.createdAt))
    : 0;
  const profileFields = [user.name, user.email, user.phone, user.role];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );
  const earnings = listings.reduce((sum, listing) => sum + (listing.price || 0), 0);
  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' });
  const affiliateCode =
    (user.id || 'REAL-USER')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 12)
      .toUpperCase() || 'REAL-USER';

  const listingsTable = listings.slice(0, 5);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const navItems = [
    { label: 'Dashboard', icon: '📊', ref: topRef, active: true },
    { label: 'Documents', icon: '📄', ref: documentsRef },
    { label: 'Payments', icon: '💳', ref: quickActionsRef },
    { label: 'Calendar', icon: '📅', ref: bookingsRef },
    { label: 'My Profile', icon: '👤', ref: personalInfoRef },
    { label: 'Messages', icon: '💬', ref: messagesRef },
    { label: 'Bookings', icon: '📅', ref: bookingsRef },
    {
      label: 'Compare Favorites',
      icon: '❤️',
      action: () => router.push(`/${locale}/listings/compare`),
    },
  ];

  return (
    <div ref={topRef} className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[240px,1fr,300px]">
        {/* Ліва панель навігації */}
        <aside className="hidden lg:flex flex-col gap-4 bg-surface rounded-3xl border border-subtle shadow-md p-4">
          <nav className="space-y-1 text-sm">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center gap-2 ${
                  item.active
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-muted-foreground hover:bg-surface-secondary'
                }`}
                onClick={() => {
                  if (item.action) item.action();
                  else scrollToSection(item.ref);
                }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-4 border-t border-subtle">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <span>🌞</span>
              <span>Theme: Dark</span>
            </div>
            <ThemeToggle />
          </div>
        </aside>

        {/* Центральна область */}
        <main className="space-y-6">
          {/* Картка профілю */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6">
            <div className="flex items-center gap-4 mb-4">
              {user.avatar ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={user.avatar}
                    alt={user.name || 'User'}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-xl font-semibold text-white">
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground uppercase">
                  {user.name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 h-11 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md hover:bg-primary-700 transition-all hover:shadow-lg"
                onClick={handleEditProfile}>
                Edit profile
              </button>
              {isOwnProfile && (
                <button
                  onClick={handleSignOut}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-semibold shadow hover:bg-red-700">
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Статистичні картки */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-500 text-white p-6 shadow-md">
              <p className="text-sm text-white/80">Private Listings</p>
              <p className="mt-3 text-4xl font-semibold">{listings.length}</p>
              <p className="mt-2 text-xs text-white/70">Owned by you</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white p-6 shadow-md">
              <p className="text-sm text-white/80">Account Age (days)</p>
              <p className="mt-3 text-4xl font-semibold">{accountAgeDays}</p>
              <p className="mt-2 text-xs text-white/70">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Profile Completeness</h3>
            </div>
            <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}></div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {profileCompletion}% complete. Complete your profile to build trust and speed up
              bookings.
            </p>
          </div>

          {/* Згорнуті секції */}
          <div className="space-y-4">
            {/* Personal Info */}
            <div
              ref={personalInfoRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('personalInfo')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <h3 className="text-lg font-semibold text-foreground">Personal info</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.personalInfo ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.personalInfo && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full name</label>
                      <input
                        value={
                          editMode && isOwnProfile && !isDemoProfile ? editData.name : displayName
                        }
                        onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                        readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                        placeholder={isDemoProfile ? 'Demo User' : 'Add full name'}
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500'
                            : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <input
                        value={displayEmail}
                        readOnly={true}
                        disabled
                        className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary/50 text-muted-foreground cursor-not-allowed opacity-70"
                        title="Email cannot be changed"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <input
                        value={
                          editMode && isOwnProfile && !isDemoProfile ? editData.phone : displayPhone
                        }
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                        placeholder={isDemoProfile ? '+380 00 000 00 00' : 'Add phone'}
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500'
                            : ''
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <input
                        value={
                          editMode && isOwnProfile && !isDemoProfile
                            ? editData.location
                            : displayLocation
                        }
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, location: e.target.value }))
                        }
                        readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                        placeholder={isDemoProfile ? 'City, Country' : 'City, Country'}
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500'
                            : ''
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">About you</label>
                    <textarea
                      value={editMode && isOwnProfile && !isDemoProfile ? editData.bio : displayBio}
                      onChange={(e) => setEditData((prev) => ({ ...prev, bio: e.target.value }))}
                      readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                      placeholder={isDemoProfile ? 'Short bio' : 'Describe yourself'}
                      className={`mt-1 w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground ${
                        editMode && isOwnProfile && !isDemoProfile
                          ? 'focus:outline-none focus:ring-2 focus:ring-primary-500'
                          : ''
                      }`}
                      rows={3}
                    />
                  </div>

                  {isOwnProfile && !isDemoProfile && (
                    <div className="mt-6 flex justify-end gap-3">
                      {editMode ? (
                        <>
                          <button
                            className="h-10 px-4 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-muted-foreground hover:border-primary-400"
                            onClick={handleCancelEdit}
                            disabled={savingProfile}>
                            Cancel
                          </button>
                          <button
                            className="h-10 px-5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow hover:bg-primary-700 disabled:opacity-60"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}>
                            {savingProfile ? 'Saving...' : 'Save changes'}
                          </button>
                        </>
                      ) : (
                        <button
                          className="h-11 px-6 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md hover:bg-primary-700 transition-all hover:shadow-lg"
                          onClick={handleEditProfile}>
                          Edit profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Documents */}
            <div
              ref={documentsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('documents')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <h3 className="text-lg font-semibold text-foreground">Documents</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.documents ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.documents && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4 space-y-3 text-sm">
                    {listingsTable.length === 0 ? (
                      <p className="text-muted-foreground">No documents yet.</p>
                    ) : (
                      listingsTable.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{item.title || 'Listing'}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : '--'} ·
                              #{item.id.slice(0, 10).toUpperCase()}
                            </p>
                          </div>
                          <button
                            className="rounded-lg border border-subtle bg-surface-secondary px-3 py-1 text-xs font-medium text-foreground hover:border-primary-400"
                            onClick={() => router.push(`/listings/${item.id}`)}>
                            View
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    className="w-full h-10 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground hover:border-primary-400 mt-4"
                    onClick={() =>
                      listingsTable[0] ? router.push(`/listings/${listingsTable[0].id}`) : undefined
                    }>
                    Open last confirmation
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('messages')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <h3 className="text-lg font-semibold text-foreground">Messages</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.messages ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.messages && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No messages yet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Support */}
            <div
              ref={supportRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('support')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <h3 className="text-lg font-semibold text-foreground">Support</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.support ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.support && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4">
                    {isOwnProfile ? (
                      showSupportChat ? (
                        <SupportChat onClose={() => setShowSupportChat(false)} />
                      ) : (
                        <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 text-center">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">💬</span>
                              <h3 className="text-lg font-semibold text-foreground">Support</h3>
                            </div>
                            <button
                              onClick={() => toggleSection('support')}
                              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                              Hide <span>^</span>
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-6">
                            Need help? Contact our support team and we'll get back to you as soon as
                            possible.
                          </p>
                          <button
                            onClick={() => setShowSupportChat(true)}
                            className="w-full h-12 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 flex items-center justify-center gap-2">
                            <span className="text-xl">💬</span>
                            Contact Support
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>Please sign in to access support chat</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bookings */}
            <div
              ref={bookingsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('bookings')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <h3 className="text-lg font-semibold text-foreground">Bookings</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.bookings ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.bookings && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-2 rounded-xl bg-surface-secondary p-1">
                      <button className="flex-1 h-9 rounded-lg bg-primary-600 text-white text-sm font-medium">
                        My bookings
                      </button>
                      <button className="flex-1 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface">
                        For my listings
                      </button>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium text-foreground">Current</p>
                        <p>No items.</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">History</p>
                        <p>No items.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Listings */}
            <div
              ref={listingsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('listings')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏷️</span>
                  <h3 className="text-lg font-semibold text-foreground">Listings</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.listings ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.listings && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4 overflow-x-auto">
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground border-b border-subtle">
                          <tr>
                            <th className="py-3">Title</th>
                            <th className="py-3">Type</th>
                            <th className="py-3">Price</th>
                            <th className="py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listingsLoading ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-muted-foreground">
                                Loading listings...
                              </td>
                            </tr>
                          ) : listingsTable.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-muted-foreground">
                                No listings yet.
                              </td>
                            </tr>
                          ) : (
                            listingsTable.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-subtle/60 last:border-none">
                                <td className="py-3">
                                  <Link
                                    href={`/listings/${item.id}`}
                                    className="text-primary-500 hover:text-primary-600">
                                    {item.title || 'Listing'}
                                  </Link>
                                </td>
                                <td className="py-3 capitalize text-muted-foreground">
                                  {item.type || 'private'}
                                </td>
                                <td className="py-3 text-muted-foreground">
                                  {item.price
                                    ? `${item.price.toLocaleString()} ${item.currency || ''}`
                                    : '--'}
                                </td>
                                <td className="py-3 text-muted-foreground">
                                  {item.status || 'published'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {isOwnProfile && (
                      <div className="mt-4 flex justify-end">
                        <Link
                          href="/listings"
                          className="rounded-xl border border-subtle bg-surface-secondary text-sm font-medium px-4 py-2 text-foreground hover:border-primary-400">
                          Open My listings
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Affiliate Code */}
            <div
              ref={affiliateRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
              <button
                onClick={() => toggleSection('affiliate')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎁</span>
                  <h3 className="text-lg font-semibold text-foreground">Affiliate Code</h3>
                </div>
                <span className="text-muted-foreground text-xl transition-transform duration-200">
                  {expandedSections.affiliate ? '▼' : '▶'}
                </span>
              </button>
              {expandedSections.affiliate && (
                <div className="px-6 pb-6 pt-0 transition-all duration-300 ease-in-out">
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Share this code with others to track referrals.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        value={affiliateCode}
                        readOnly
                        className="flex-1 h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                      />
                      <button
                        className="h-11 w-11 rounded-xl border border-subtle bg-surface-secondary text-muted-foreground text-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(affiliateCode);
                          alert('Affiliate code copied');
                        }}>
                        ⧉
                      </button>
                      <button
                        className="h-11 w-11 rounded-xl border border-subtle bg-surface-secondary text-muted-foreground text-lg"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}?ref=${affiliateCode}`,
                          );
                          alert('Referral link copied');
                        }}>
                        🔗
                      </button>
                    </div>
                    <div className="mt-4 grid sm:grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                      {['Share', 'Facebook', 'Instagram', 'Telegram', 'WhatsApp', 'Email'].map(
                        (platform) => (
                          <button
                            key={platform}
                            className={`h-10 rounded-xl border border-subtle bg-surface-secondary text-foreground hover:border-primary-400 ${
                              platform === 'Telegram'
                                ? 'bg-primary-600 text-white border-primary-600'
                                : ''
                            }`}
                            onClick={() => handleShare(platform, affiliateCode)}>
                            {platform}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Права панель */}
        <aside className="hidden lg:flex flex-col gap-6">
          {/* Referral Code */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6">
            <p className="text-sm text-muted-foreground mb-2">You already have a referral code:</p>
            <p className="text-lg font-semibold text-foreground font-mono">{affiliateCode}</p>
          </div>

          {/* Quick Actions */}
          <div
            ref={quickActionsRef}
            className="rounded-3xl border border-subtle bg-surface shadow-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick actions</h3>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Potential earnings</p>
              <select className="w-full h-10 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm mb-3">
                <option>Quarter</option>
                <option>Month</option>
                <option>Year</option>
              </select>
              <p className="text-3xl font-semibold text-foreground mb-1">
                {currencyFormatter.format(earnings / 4 || 0)}
              </p>
              <div className="h-24 bg-surface-secondary rounded-xl flex items-end justify-between p-2 gap-1">
                {['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, idx) => (
                  <div
                    key={month}
                    className="flex-1 bg-primary-600 rounded-t"
                    style={{ height: `${Math.random() * 20}%` }}></div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/listings"
                className="flex-1 h-10 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground hover:border-primary-400 text-center flex items-center justify-center">
                Browse listings
              </Link>
              {isOwnProfile ? (
                <Link
                  href="/my-listings"
                  className="flex-1 h-10 rounded-xl bg-primary-600 text-white text-xs font-medium shadow hover:bg-primary-700 flex items-center justify-center whitespace-nowrap px-2">
                  Manage my listings
                </Link>
              ) : (
                <Link
                  href="/how-it-works"
                  className="flex-1 h-10 rounded-xl bg-primary-600 text-white text-sm font-medium shadow hover:bg-primary-700 flex items-center justify-center">
                  Get started
                </Link>
              )}
            </div>
          </div>

          {/* Upload Listing */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6">
            <p className="text-sm text-muted-foreground mb-4">Upload a listing to view data</p>
            <Link
              href={isOwnProfile ? '/listings/create' : '/how-it-works'}
              className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 flex items-center justify-center mb-4">
              Upload first listing
            </Link>
            {listings.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Recent listings:</p>
                {listings.slice(0, 3).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="block p-2 rounded-lg bg-surface-secondary hover:bg-surface border border-subtle transition">
                    <p className="text-xs font-medium text-foreground truncate">
                      {listing.title || 'Untitled Listing'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {listing.price
                        ? `${listing.price.toLocaleString()} ${listing.currency || ''}`
                        : 'No price'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 h-32 bg-surface-secondary rounded-xl flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center px-4">
                  No listings yet. Upload your first listing to see it here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
