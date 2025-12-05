'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SupportChat } from './SupportChat';
import { useToast } from '@/components/ui/ToastContainer';

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
  const toast = useToast();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    avatar?: string | null;
    location?: string | null;
    bio?: string | null;
    iban?: string | null;
    role?: string;
    [key: string]: unknown;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<
    Array<{
      id: string;
      title: string;
      price: number;
      address?: string;
      status: string;
      [key: string]: unknown;
    }>
  >([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeBookingTab, setActiveBookingTab] = useState<'my-bookings' | 'for-listings'>(
    'my-bookings',
  );
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
    iban: '',
  });
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
  const [earningsPeriod, setEarningsPeriod] = useState<'month' | 'quarter' | 'year'>('month');

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
        iban: (user as { iban?: string | null }).iban || '',
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
          toast.success('Share link copied to clipboard');
        }
        break;
      case 'Facebook':
        if (typeof window !== 'undefined') {
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank',
          );
        }
        break;
      case 'Instagram':
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(message);
          toast.success('Message copied. Share it on Instagram!');
        }
        break;
      case 'Telegram':
        if (typeof window !== 'undefined') {
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
              message,
            )}`,
            '_blank',
          );
        }
        break;
      case 'WhatsApp':
        if (typeof window !== 'undefined') {
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        }
        break;
      case 'Email':
        if (typeof window !== 'undefined') {
          window.location.href = `mailto:?subject=RealEstate referral&body=${encodeURIComponent(
            message,
          )}`;
        }
        break;
      default:
        break;
    }
  };

  const handleSignOut = () => {
    router.push('/how-it-works?logout=true');
  };

  // Reserved for future implementation
  // const handleApproveAll = async () => {
  //   toast.info('Approve all listings is not implemented in this demo.');
  // };

  // const handleReject = (id: string) => {
  //   toast.info(`Reject flow for listing ${id} is not implemented in this demo.`);
  // };

  // const toggleFeatureList = () => {
  //   toast.info('Toggle feature list is not implemented in this demo.');
  // };

  // const renderFeatureChip = (feature: string, idx: number) => {
  //   return (
  //     <span
  //       key={idx}
  //       className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-surface-secondary text-muted-foreground">
  //       {feature}
  //     </span>
  //   );
  // };

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
        iban: (user as { iban?: string | null }).iban || '',
      });
    }
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      if (!user) {
        toast.error('User data not available');
        setSavingProfile(false);
        return;
      }

      const validationErrors: string[] = [];

      if (user.name && user.name.trim() !== '' && (!editData.name || editData.name.trim() === '')) {
        validationErrors.push('Full name cannot be empty');
      }
      if (
        user.phone &&
        user.phone.trim() !== '' &&
        (!editData.phone || editData.phone.trim() === '')
      ) {
        validationErrors.push('Phone cannot be empty');
      }
      if (
        user.location &&
        user.location.trim() !== '' &&
        (!editData.location || editData.location.trim() === '')
      ) {
        validationErrors.push('Location cannot be empty');
      }
      if (user.bio && user.bio.trim() !== '' && (!editData.bio || editData.bio.trim() === '')) {
        validationErrors.push('About you cannot be empty');
      }

      if (validationErrors.length > 0) {
        toast.error(
          validationErrors.join('. ') +
            '. Please fill in the fields or replace them with new values.',
        );
        setSavingProfile(false);
        return;
      }

      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('phone', editData.phone);
      formData.append('location', editData.location);
      formData.append('bio', editData.bio);

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      // Зберігаємо IBAN через окремий API endpoint
      if (editData.iban && editData.iban.trim()) {
        try {
          const ibanRes = await fetch('/api/iban', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ iban: editData.iban.trim() }),
          });

          if (!ibanRes.ok) {
            console.error('Error saving IBAN:', await ibanRes.text());
          }
        } catch (error) {
          console.error('Error saving IBAN:', error);
        }
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser((prev) => (prev ? { ...prev, ...updated } : updated));
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
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

  const accountAgeDays =
    user.createdAt && typeof user.createdAt === 'string'
      ? differenceInDays(new Date(), new Date(user.createdAt))
      : 0;

  const personalInfoFields = [user.name, user.email, user.phone, user.location, user.bio];
  const filledFields = personalInfoFields.filter((field) => field && field.trim() !== '').length;
  const totalFields = personalInfoFields.length;
  const profileCompletion = Math.round((filledFields / totalFields) * 100);
  // Розрахунок заробітків на основі опублікованих listings
  const publishedListings = listings.filter((l) => l.status === 'PUBLISHED');

  // Розрахунок заробітків за різні періоди
  const calculateEarnings = (period: 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Фільтруємо listings, створені в цьому періоді
    const periodListings = publishedListings.filter((listing) => {
      const dateStr = (listing.createdAt || listing.updatedAt) as string | undefined;
      if (!dateStr || typeof dateStr !== 'string') return false;
      const listingDate = new Date(dateStr);
      return listingDate >= startDate;
    });

    // Розраховуємо суму (можна додати комісію, наприклад 10%)
    const total = periodListings.reduce((sum, listing) => sum + (listing.price || 0), 0);
    const commission = 0.1; // 10% комісія платформи
    return total * (1 - commission);
  };

  const earnings = calculateEarnings(earningsPeriod);

  // Дані для графіка (останні 5 місяців)
  const getChartData = () => {
    const months = [];
    const now = new Date();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (let i = 4; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];

      // Розраховуємо заробітки за цей місяць
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthListings = publishedListings.filter((listing) => {
        const dateStr = (listing.createdAt || listing.updatedAt) as string | undefined;
        if (!dateStr || typeof dateStr !== 'string') return false;
        const listingDate = new Date(dateStr);
        return listingDate >= monthStart && listingDate <= monthEnd;
      });

      const monthEarnings =
        monthListings.reduce((sum, listing) => sum + (listing.price || 0), 0) * 0.9;
      months.push({ name: monthName, earnings: monthEarnings });
    }

    // Розраховуємо максимальне значення для нормалізації висоти
    const maxEarnings = Math.max(...months.map((m) => m.earnings), 1);

    // Додаємо висоту для кожного місяця (мінімум 5% для візуалізації)
    return months.map((month) => ({
      ...month,
      height: maxEarnings > 0 ? Math.max((month.earnings / maxEarnings) * 100, 5) : 5,
    }));
  };

  const chartData = getChartData();

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (publishedListings[0]?.currency as string | undefined) || 'EUR',
  });
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

  // SVG іконки для навігації
  const getIcon = (label: string) => {
    const iconClass = 'w-5 h-5';
    switch (label) {
      case 'Dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        );
      case 'Documents':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'Payments':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        );
      case 'Calendar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'My Profile':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 'Messages':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'Bookings':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'Compare Favorites':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        );
      case 'Support':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case 'Affiliate Code':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleNavClick = (item: {
    label: string;
    ref?: React.RefObject<HTMLDivElement>;
    action?: () => void;
  }) => {
    if (item.action) {
      item.action();
      return;
    }

    // Визначаємо, яку секцію потрібно розгорнути
    let sectionToExpand: keyof typeof expandedSections | null = null;

    switch (item.label) {
      case 'Dashboard':
        // Dashboard завжди на початку, не потребує розгортання
        break;
      case 'Documents':
        sectionToExpand = 'documents';
        break;
      case 'Payments':
        // Payments - це quickActions, не має окремої секції для розгортання
        break;
      case 'Calendar':
      case 'Bookings':
        sectionToExpand = 'bookings';
        break;
      case 'My Profile':
        sectionToExpand = 'personalInfo';
        break;
      case 'Messages':
        sectionToExpand = 'messages';
        break;
    }

    // Розгортаємо секцію, якщо вона згорнута
    if (sectionToExpand && !expandedSections[sectionToExpand]) {
      toggleSection(sectionToExpand);
    }

    // Прокручуємо до секції
    if (item.ref) {
      setTimeout(() => {
        scrollToSection(item.ref);
      }, 100); // Невелика затримка для завершення анімації розгортання
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: getIcon('Dashboard'), ref: topRef, active: true },
    { label: 'Documents', icon: getIcon('Documents'), ref: documentsRef },
    { label: 'Payments', icon: getIcon('Payments'), ref: quickActionsRef },
    { label: 'Calendar', icon: getIcon('Calendar'), ref: bookingsRef },
    { label: 'My Profile', icon: getIcon('My Profile'), ref: personalInfoRef },
    { label: 'Messages', icon: getIcon('Messages'), ref: messagesRef },
    { label: 'Bookings', icon: getIcon('Bookings'), ref: bookingsRef },
    {
      label: 'Compare Favorites',
      icon: getIcon('Compare Favorites'),
      action: () => router.push(`/${locale}/listings/compare`),
    },
  ];

  return (
    <div ref={topRef} className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <div className="grid gap-6 lg:grid-cols-[240px,1fr,300px]">
        {/* Ліва панель навігації */}
        <aside className="hidden lg:flex flex-col gap-4 bg-surface rounded-3xl border border-subtle shadow-md p-4 animate-in slide-in-from-left duration-500">
          <nav className="space-y-1 text-sm">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] ${
                  item.active
                    ? 'bg-primary-600 text-white shadow-lg scale-[1.02]'
                    : 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground'
                }`}
                onClick={() => handleNavClick(item)}>
                <span className="transition-transform duration-300">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 pt-4 border-t border-subtle">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Theme: Dark</span>
            </div>
            <ThemeToggle />
          </div>
        </aside>

        {/* Центральна область */}
        <main className="space-y-6">
          {/* Картка профілю */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 animate-in fade-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4 mb-4">
              {user.avatar ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-500/20 transition-all duration-300 hover:ring-primary-500/40 hover:scale-110">
                  <Image
                    src={user.avatar}
                    alt={user.name || 'User'}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-xl font-semibold text-white transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 animate-in fade-in slide-in-from-left duration-500 delay-100">
                <h3 className="text-lg font-semibold text-foreground uppercase">
                  {user.name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 h-11 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md hover:bg-primary-700 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleEditProfile}>
                Edit profile
              </button>
              {isOwnProfile && (
                <button
                  onClick={handleSignOut}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-semibold shadow transition-all duration-300 hover:bg-red-700 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Статистичні картки */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-500 text-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform animate-in fade-in slide-in-from-bottom duration-500 delay-150">
              <p className="text-sm text-white/80">Private Listings</p>
              <p className="mt-3 text-4xl font-semibold transition-all duration-500">
                {listings.length}
              </p>
              <p className="mt-2 text-xs text-white/70">Owned by you</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02] transform animate-in fade-in slide-in-from-bottom duration-500 delay-200">
              <p className="text-sm text-white/80">Account Age (days)</p>
              <p className="mt-3 text-4xl font-semibold transition-all duration-500">
                {accountAgeDays}
              </p>
              <p className="mt-2 text-xs text-white/70">
                {user.createdAt && typeof user.createdAt === 'string'
                  ? new Date(user.createdAt).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          {/* Profile Completeness - Показується тільки якщо профіль не заповнений на 100% */}
          {profileCompletion < 100 && (
            <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 animate-in fade-in slide-in-from-bottom duration-500 delay-250">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Profile Completeness</h3>
              </div>
              <div className="h-2 rounded-full bg-surface-secondary overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-500 transition-all duration-700 ease-out rounded-full relative overflow-hidden"
                  style={{ width: `${profileCompletion}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground transition-all duration-300">
                {profileCompletion}% complete. Complete your profile to build trust and speed up
                bookings.
              </p>
            </div>
          )}

          {/* Згорнуті секції */}
          <div className="space-y-4">
            {/* Personal Info */}
            <div
              ref={personalInfoRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('personalInfo')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">{getIcon('My Profile')}</span>
                  <h3 className="text-lg font-semibold text-foreground">Personal info</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.personalInfo ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.personalInfo ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground transition-colors duration-300">
                        Full name
                      </label>
                      <input
                        value={
                          editMode && isOwnProfile && !isDemoProfile ? editData.name : displayName
                        }
                        onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                        readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                        placeholder={isDemoProfile ? 'Demo User' : 'Add full name'}
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400'
                            : 'hover:border-subtle-hover'
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
                      <label className="text-sm font-medium text-muted-foreground transition-colors duration-300">
                        Phone
                      </label>
                      <input
                        value={
                          editMode && isOwnProfile && !isDemoProfile ? editData.phone : displayPhone
                        }
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                        placeholder={isDemoProfile ? '+380 00 000 00 00' : 'Add phone'}
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400'
                            : 'hover:border-subtle-hover'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground transition-colors duration-300">
                        Location
                      </label>
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
                        className={`mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 ${
                          editMode && isOwnProfile && !isDemoProfile
                            ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400'
                            : 'hover:border-subtle-hover'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground transition-colors duration-300">
                      About you
                    </label>
                    <textarea
                      value={editMode && isOwnProfile && !isDemoProfile ? editData.bio : displayBio}
                      onChange={(e) => setEditData((prev) => ({ ...prev, bio: e.target.value }))}
                      readOnly={!(editMode && isOwnProfile && !isDemoProfile)}
                      placeholder={isDemoProfile ? 'Short bio' : 'Describe yourself'}
                      className={`mt-1 w-full px-3 py-2 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 resize-none ${
                        editMode && isOwnProfile && !isDemoProfile
                          ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400'
                          : 'hover:border-subtle-hover'
                      }`}
                      rows={3}
                    />
                  </div>

                  {isOwnProfile && !isDemoProfile && (
                    <div
                      className={`mt-6 flex justify-end gap-3 transition-all duration-500 ${
                        editMode ? 'animate-in fade-in slide-in-from-bottom' : ''
                      }`}>
                      {editMode ? (
                        <>
                          <button
                            className="h-10 px-4 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-muted-foreground transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 transform hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleCancelEdit}
                            disabled={savingProfile}>
                            Cancel
                          </button>
                          <button
                            className="h-10 px-5 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow transition-all duration-300 hover:bg-primary-700 hover:shadow-lg disabled:opacity-60 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}>
                            {savingProfile ? (
                              <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Saving...
                              </span>
                            ) : (
                              'Save changes'
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          className="h-11 px-6 rounded-xl bg-primary-600 text-white text-sm font-semibold shadow-md transition-all duration-300 hover:bg-primary-700 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                          onClick={handleEditProfile}>
                          Edit profile
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div
              ref={documentsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('documents')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">{getIcon('Documents')}</span>
                  <h3 className="text-lg font-semibold text-foreground">Documents</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.documents ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.documents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="mt-4 space-y-3 text-sm">
                    {listingsTable.length === 0 ? (
                      <p className="text-muted-foreground">No documents yet.</p>
                    ) : (
                      listingsTable.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{item.title || 'Listing'}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt && typeof item.createdAt === 'string'
                                ? new Date(item.createdAt).toLocaleString()
                                : '--'}{' '}
                              · #{item.id.slice(0, 10).toUpperCase()}
                            </p>
                          </div>
                          <button
                            className="rounded-lg border border-subtle bg-surface-secondary px-3 py-1 text-xs font-medium text-foreground transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 transform hover:scale-[1.05] active:scale-[0.95]"
                            onClick={() => router.push(`/listings/${item.id}`)}>
                            View
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <button
                    className="w-full h-10 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 mt-4 transform hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() =>
                      listingsTable[0] ? router.push(`/listings/${listingsTable[0].id}`) : undefined
                    }>
                    Open last confirmation
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('messages')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">{getIcon('Messages')}</span>
                  <h3 className="text-lg font-semibold text-foreground">Messages</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.messages ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.messages ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="text-center py-12 text-muted-foreground animate-in fade-in duration-500">
                      <p>No messages yet.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support */}
            <div
              ref={supportRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('support')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">{getIcon('Support')}</span>
                  <h3 className="text-lg font-semibold text-foreground">Support</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.support ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.support ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="mt-4">
                    {isOwnProfile ? (
                      showSupportChat ? (
                        <SupportChat onClose={() => setShowSupportChat(false)} />
                      ) : (
                        <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 text-center animate-in fade-in slide-in-from-bottom duration-500">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-foreground">Support</h3>
                            </div>
                            <button
                              onClick={() => toggleSection('support')}
                              className="text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground flex items-center gap-1 transform hover:scale-110">
                              Hide <span>^</span>
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-6">
                            Need help? Contact our support team and we&apos;ll get back to you as
                            soon as possible.
                          </p>
                          <button
                            onClick={() => setShowSupportChat(true)}
                            className="w-full h-12 rounded-xl bg-primary-600 text-white font-semibold shadow transition-all duration-300 hover:bg-primary-700 hover:shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]">
                            Contact Support
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-12 text-muted-foreground animate-in fade-in duration-500">
                        <p>Please sign in to access support chat</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bookings */}
            <div
              ref={bookingsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('bookings')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">{getIcon('Bookings')}</span>
                  <h3 className="text-lg font-semibold text-foreground">Bookings</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.bookings ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.bookings ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-2 rounded-xl bg-surface-secondary p-1">
                      <button
                        onClick={() => setActiveBookingTab('my-bookings')}
                        className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all duration-300 transform ${
                          activeBookingTab === 'my-bookings'
                            ? 'bg-primary-600 text-white shadow-md scale-[1.02]'
                            : 'text-muted-foreground hover:bg-surface hover:scale-[1.01]'
                        }`}>
                        My bookings
                      </button>
                      <button
                        onClick={() => setActiveBookingTab('for-listings')}
                        className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all duration-300 transform ${
                          activeBookingTab === 'for-listings'
                            ? 'bg-primary-600 text-white shadow-md scale-[1.02]'
                            : 'text-muted-foreground hover:bg-surface hover:scale-[1.01]'
                        }`}>
                        For my listings
                      </button>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      {activeBookingTab === 'my-bookings' ? (
                        <>
                          <div>
                            <p className="font-medium text-foreground">Current</p>
                            <p>No items.</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">History</p>
                            <p>No items.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="font-medium text-foreground">Current</p>
                            <p>No items.</p>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">History</p>
                            <p>No items.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listings */}
            <div
              ref={listingsRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('listings')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-foreground">Listings</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.listings ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.listings ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
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
                                  {(item.type as string | undefined) || 'private'}
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
                          href={`/${locale}/my-listings`}
                          className="rounded-xl border border-subtle bg-surface-secondary text-sm font-medium px-4 py-2 text-foreground hover:border-primary-400">
                          Open My listings
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Affiliate Code */}
            <div
              ref={affiliateRef}
              className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom duration-500">
              <button
                onClick={() => toggleSection('affiliate')}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-secondary transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="transition-transform duration-300">
                    {getIcon('Affiliate Code')}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">Affiliate Code</h3>
                </div>
                <span
                  className={`text-muted-foreground text-xl transition-transform duration-300 ${
                    expandedSections.affiliate ? 'rotate-0' : '-rotate-90'
                  }`}>
                  ▼
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSections.affiliate ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-6 pb-6 pt-0">
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground animate-in fade-in duration-500">
                      Share this code with others to track referrals.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <input
                        value={affiliateCode}
                        readOnly
                        className="flex-1 h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 hover:border-primary-400"
                      />
                      <button
                        className="h-11 w-11 rounded-xl border border-subtle bg-surface-secondary text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary-400 hover:bg-primary-50 flex items-center justify-center transform hover:scale-110 active:scale-95"
                        onClick={() => {
                          navigator.clipboard.writeText(affiliateCode);
                          toast.success('Affiliate code copied');
                        }}
                        title="Copy code">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <button
                        className="h-11 w-11 rounded-xl border border-subtle bg-surface-secondary text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-primary-400 hover:bg-primary-50 flex items-center justify-center transform hover:scale-110 active:scale-95"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(
                              `${
                                typeof window !== 'undefined' ? window.location.origin : ''
                              }?ref=${affiliateCode}`,
                            );
                            toast.success('Referral link copied');
                          }
                        }}
                        title="Copy link">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 grid sm:grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                      {['Share', 'Facebook', 'Instagram', 'Telegram', 'WhatsApp', 'Email'].map(
                        (platform) => (
                          <button
                            key={platform}
                            className={`h-10 rounded-xl border border-subtle bg-surface-secondary text-foreground transition-all duration-300 hover:border-primary-400 transform hover:scale-[1.05] active:scale-[0.95] ${
                              platform === 'Telegram'
                                ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                                : 'hover:bg-primary-50'
                            }`}
                            onClick={() => handleShare(platform, affiliateCode)}>
                            {platform}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Права панель */}
        <aside className="hidden lg:flex flex-col gap-6 animate-in fade-in slide-in-from-right duration-500">
          {/* Referral Code */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <p className="text-sm text-muted-foreground mb-2">You already have a referral code:</p>
            <p className="text-lg font-semibold text-foreground font-mono transition-all duration-300">
              {affiliateCode}
            </p>
          </div>

          {/* Quick Actions */}
          <div
            ref={quickActionsRef}
            className="rounded-3xl border border-subtle bg-surface shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick actions</h3>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Potential earnings</p>
              <select
                value={earningsPeriod}
                onChange={(e) => setEarningsPeriod(e.target.value as 'month' | 'quarter' | 'year')}
                className="w-full h-10 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm mb-3 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400">
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
              <p className="text-3xl font-semibold text-foreground mb-1 transition-all duration-500">
                {currencyFormatter.format(earnings || 0)}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Based on {publishedListings.length} published{' '}
                {publishedListings.length === 1 ? 'listing' : 'listings'}
              </p>
              <div className="h-24 bg-surface-secondary rounded-xl flex items-end justify-between p-2 gap-1">
                {chartData.map((data, idx) => (
                  <div
                    key={`${data.name}-${idx}`}
                    className="flex-1 bg-primary-600 rounded-t transition-all duration-300 hover:bg-primary-500 hover:scale-105 group relative transform"
                    style={{ height: `${data.height}%` }}
                    title={`${data.name}: ${currencyFormatter.format(data.earnings)}`}>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-10">
                      {data.name}: {currencyFormatter.format(data.earnings)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/${locale}/listings`}
                className="flex-1 h-10 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 text-center flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]">
                Browse listings
              </Link>
              {isOwnProfile ? (
                <Link
                  href={`/${locale}/my-listings`}
                  className="flex-1 h-10 rounded-xl bg-primary-600 text-white text-xs font-medium shadow transition-all duration-300 hover:bg-primary-700 hover:shadow-lg flex items-center justify-center whitespace-nowrap px-2 transform hover:scale-[1.02] active:scale-[0.98]">
                  Manage my listings
                </Link>
              ) : (
                <Link
                  href={`/${locale}/how-it-works`}
                  className="flex-1 h-10 rounded-xl bg-primary-600 text-white text-sm font-medium shadow transition-all duration-300 hover:bg-primary-700 hover:shadow-lg flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]">
                  Get started
                </Link>
              )}
            </div>
          </div>

          {/* Upload Listing */}
          <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 transition-all duration-300 hover:shadow-lg">
            <p className="text-sm text-muted-foreground mb-4">Upload a listing to view data</p>
            <Link
              href={isOwnProfile ? `/${locale}/my-listings` : `/${locale}/how-it-works`}
              className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow transition-all duration-300 hover:bg-primary-700 hover:shadow-lg flex items-center justify-center mb-4 transform hover:scale-[1.02] active:scale-[0.98]">
              Upload first listing
            </Link>
            {listings.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Recent listings:</p>
                {listings.slice(0, 3).map((listing, idx) => (
                  <Link
                    key={listing.id}
                    href={`/${locale}/listings/${listing.id}`}
                    className="block p-2 rounded-lg bg-surface-secondary border border-subtle transition-all duration-300 hover:bg-surface hover:border-primary-400 hover:shadow-md transform hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
                    style={{ animationDelay: `${idx * 100}ms` }}>
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
              <div className="mt-4 h-32 bg-surface-secondary rounded-xl flex items-center justify-center animate-in fade-in duration-500">
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
