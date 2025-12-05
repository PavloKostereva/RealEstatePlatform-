'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdminStats, useAdminListings } from '@/hooks/useAdmin';
import { TableRowsSkeleton } from '@/components/skeletons/TableRowsSkeleton';
import { AdminSupportChat } from './AdminSupportChat';
import { AdminHeader } from './AdminHeader';
import { useToast } from '@/components/ui/ToastContainer';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  area?: number | null;
  currency: string;
  category: string;
  address: string;
  status: string;
  createdAt: string;
  images?: string[];
  owner?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
}

interface StatsData {
  totalListings: number;
  totalUsers: number;
  pendingListings: number;
  listingsThisWeek: number;
  usersThisWeek: number;
  listingsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
}

const featurePresets = [
  'Climate controlled',
  '24/7 access',
  'Lockers',
  'Cold storage',
  'Insurance available',
  'Secure facility',
  'Drive-up access',
  'CCTV',
];

const supportConversationsMock = [
  {
    id: 'conv-1',
    email: 'client@example.com',
    unread: 1,
    updatedAt: new Date().toISOString(),
    preview: 'Welcome to RealEstate support! How can we help you today?',
  },
  {
    id: 'conv-2',
    email: 'landlord@example.com',
    unread: 0,
    updatedAt: new Date().toISOString(),
    preview: 'Your listing has been approved. Let us know if you need anything else.',
  },
];

interface IbanSubmission {
  id: string;
  email: string;
  iban: string;
  createdAt: string;
}

export function AdminDashboard() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'approvals' | 'support' | 'iban'>(
    'listings',
  );
  const [stats, setStats] = useState<StatsData | null>(null);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', order: 'desc', category: 'all' });
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);
  const [ibanSubmissions, setIbanSubmissions] = useState<IbanSubmission[]>([]);
  const [ibanLoading, setIbanLoading] = useState(false);
  const [ibanFilters, setIbanFilters] = useState({
    search: '',
    fromDate: '',
    toDate: '',
  });
  // Зберігаємо стан розгорнутих секцій для кожної вкладки окремо
  const [expandedSectionsByTab, setExpandedSectionsByTab] = useState<
    Record<
      string,
      {
        createForm: boolean;
        filters: boolean;
        listingsTable: boolean;
        support: boolean;
      }
    >
  >({
    listings: {
      createForm: false,
      filters: true,
      listingsTable: true,
      support: true,
    },
    approvals: {
      createForm: false,
      filters: true,
      listingsTable: true,
      support: true,
    },
    support: {
      createForm: false,
      filters: true,
      listingsTable: true,
      support: true,
    },
    iban: {
      createForm: false,
      filters: true,
      listingsTable: true,
      support: true,
    },
  });

  // Отримуємо поточний стан секцій для активної вкладки
  const expandedSections = expandedSectionsByTab[activeTab] || expandedSectionsByTab.listings;

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    price: '',
    area: '',
    address: '',
    imageUrl: '',
    latitude: '',
    longitude: '',
    features: [] as string[],
  });

  // Використовуємо React Query для адмін даних
  const { data: statsData, refetch: refetchStats, isError: statsError } = useAdminStats();
  const {
    data: allListingsData,
    refetch: refetchAllListings,
    isLoading: allListingsLoading,
    isError: allListingsError,
    error: allListingsErrorDetails,
  } = useAdminListings('all');
  const {
    data: pendingListingsData,
    refetch: refetchPending,
    isLoading: pendingListingsLoading,
  } = useAdminListings('PENDING_REVIEW');

  useEffect(() => {
    if (statsData) {
      setStats(statsData as unknown as StatsData);
    } else if (statsError) {
      setStats({
        totalListings: 0,
        totalUsers: 0,
        pendingListings: 0,
        listingsThisWeek: 0,
        usersThisWeek: 0,
        listingsByDay: [],
        usersByDay: [],
      });
    }
  }, [statsData, statsError]);

  useEffect(() => {
    if (activeTab === 'iban') {
      fetchIbanSubmissions();
    }
  }, [activeTab]);

  const fetchIbanSubmissions = async () => {
    setIbanLoading(true);
    try {
      const res = await fetch('/api/iban', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setIbanSubmissions(data);
      } else {
        console.error('Error fetching IBAN submissions:', res.statusText);
        setIbanSubmissions([]);
      }
    } catch (error) {
      console.error('Error fetching IBAN submissions:', error);
      setIbanSubmissions([]);
    } finally {
      setIbanLoading(false);
    }
  };

  useEffect(() => {
    console.log('AdminDashboard: allListingsData changed', {
      data: allListingsData,
      isLoading: allListingsLoading,
      isError: allListingsError,
      error: allListingsErrorDetails,
      isArray: Array.isArray(allListingsData),
      length: allListingsData?.length,
    });
    if (allListingsError) {
      console.error('Error loading listings:', allListingsErrorDetails);
      setAllListings([]);
    } else if (allListingsData && Array.isArray(allListingsData)) {
      setAllListings(allListingsData as unknown as Listing[]);
    } else if (!allListingsLoading && (allListingsData === null || allListingsData === undefined)) {
      setAllListings([]);
    }
  }, [allListingsData, allListingsLoading, allListingsError, allListingsErrorDetails]);

  useEffect(() => {
    if (pendingListingsData && Array.isArray(pendingListingsData)) {
      setPendingListings(pendingListingsData as unknown as Listing[]);
    } else if (pendingListingsData === null || pendingListingsData === undefined) {
      setPendingListings([]);
    }
  }, [pendingListingsData]);

  const refreshData = useCallback(async () => {
    await Promise.all([refetchStats(), refetchAllListings(), refetchPending()]);
  }, [refetchStats, refetchAllListings, refetchPending]);

  const handleCreateListing = async () => {
    if (!formData.title) {
      alert('Title is required');
      return;
    }
    setCreateLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.subtitle,
        type: 'RENT',
        category: 'STORAGE',
        price: parseFloat(formData.price || '0'),
        currency: 'EUR',
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        rooms: null,
        amenities: formData.features,
        availableFrom: null,
        availableTo: null,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        status: 'PUBLISHED',
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create listing');
      }

      setFormData({
        title: '',
        subtitle: '',
        price: '',
        area: '',
        address: '',
        imageUrl: '',
        latitude: '',
        longitude: '',
        features: [],
      });
      refreshData();
      alert('Listing created successfully');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create listing';
      alert(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApproveListing = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve listing');
      }
      refreshData();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve listing';
      alert(errorMessage);
    }
  };

  const handleUploadClick = () => {
    alert('Image upload flow not implemented in this demo.');
  };

  const handleApproveAll = async () => {
    if (!pendingListings.length) return;
    const confirmAction = confirm('Approve all pending listings?');
    if (!confirmAction) return;
    await Promise.all(pendingListings.map((listing) => handleApproveListing(listing.id)));
    refreshData();
  };

  const handleReject = (id: string) => {
    alert(`Reject flow for listing ${id} is not implemented in this demo.`);
  };

  const toggleFeatureList = () => {
    setShowMoreFeatures((prev) => !prev);
  };

  const filteredListings = useMemo(() => {
    const search = filters.search.toLowerCase();
    return allListings
      .filter((listing) =>
        [listing.title, listing.address, listing.owner?.email]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(search)),
      )
      .filter((listing) =>
        filters.category === 'all' ? true : listing.category === filters.category,
      )
      .sort((a, b) => {
        if (filters.order === 'asc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [allListings, filters]);

  const renderFeatureChip = (feature: string, idx: number) => {
    const active = formData.features.includes(feature);
    const hidden = idx >= 6 && !showMoreFeatures;
    if (hidden) return null;
    return (
      <button
        key={feature}
        type="button"
        onClick={() =>
          setFormData((prev) => ({
            ...prev,
            features: active
              ? prev.features.filter((f) => f !== feature)
              : [...prev.features, feature],
          }))
        }
        className={`px-3 py-1.5 rounded-xl text-sm border transition ${
          active
            ? 'bg-primary-600 text-white border-primary-600'
            : 'bg-surface-secondary text-muted-foreground border-subtle hover:border-primary-400'
        }`}>
        {feature}
      </button>
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSectionsByTab((prev) => {
      const currentTabState = prev[activeTab] || {
        createForm: false,
        filters: true,
        listingsTable: true,
        support: true,
      };
      return {
        ...prev,
        [activeTab]: {
          ...currentTabState,
          [section]: !currentTabState[section],
        },
      };
    });
  };

  const renderCreateForm = () => (
    <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden w-full max-w-full mx-auto relative">
      <div className="bg-surface-secondary px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-subtle">
        <button
          onClick={() => toggleSection('createForm')}
          className="w-full flex items-center justify-between text-left">
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary-400 text-lg sm:text-xl">＋</span>
            <span className="hidden sm:inline">Create New Self-Storage Listing</span>
            <span className="sm:hidden">Create Listing</span>
          </h2>
          <span className="text-muted-foreground text-lg sm:text-xl transition-transform duration-200 flex-shrink-0">
            {expandedSections.createForm ? '▼' : '▶'}
          </span>
        </button>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expandedSections.createForm ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr),minmax(280px,1fr)] gap-4 sm:gap-6 md:gap-8 w-full max-w-full">
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Indoor Self-Storage Unit"
                className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                Subtitle
              </label>
              <input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Short description (e.g. climate controlled)"
                className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Price/month (€)
                </label>
                <input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1200"
                  className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Size (m²)
                </label>
                <input
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="10"
                  className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Image URL
                </label>
                <input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                Address
              </label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City"
                className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                Features
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {featurePresets.map(renderFeatureChip)}
                <button
                  type="button"
                  onClick={toggleFeatureList}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm border border-subtle bg-surface-secondary text-muted-foreground hover:border-primary-400">
                  {showMoreFeatures ? 'Show less' : 'See more'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Lat</label>
                <input
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Lat"
                  className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Lng</label>
                <input
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Lng"
                  className="mt-1 w-full h-10 sm:h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-1 flex items-end">
                <button
                  type="button"
                  onClick={handleCreateListing}
                  disabled={createLoading}
                  className="w-full h-10 sm:h-11 rounded-xl bg-primary-600 text-white text-sm sm:font-semibold shadow hover:bg-primary-700 disabled:opacity-60">
                  {createLoading ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-subtle bg-surface-secondary p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 items-center justify-center text-xs sm:text-sm text-muted-foreground">
            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-surface rounded-xl border border-subtle flex items-center justify-center">
              {formData.imageUrl ? (
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  width={120}
                  height={120}
                  className="rounded-xl object-cover w-full h-full"
                />
              ) : (
                <span className="text-xs">No preview</span>
              )}
            </div>
            <p className="text-center px-2">
              Drag & Drop or provide an image URL to showcase the listing.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-primary-600 text-white text-xs sm:text-sm font-medium shadow hover:bg-primary-700 w-full sm:w-auto"
                onClick={handleUploadClick}>
                Upload
              </button>
              <button
                type="button"
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-subtle bg-surface text-xs sm:text-sm text-foreground w-full sm:w-auto"
                onClick={() =>
                  navigator.clipboard
                    .readText()
                    .then((text) => setFormData((prev) => ({ ...prev, imageUrl: text })))
                }>
                Paste URL
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderFilters = (showCategory = true) => (
    <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden w-full max-w-full mx-auto relative">
      <div className="bg-surface-secondary px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-subtle flex items-center justify-between gap-2">
        <button
          onClick={() => toggleSection('filters')}
          className="flex items-center gap-2 flex-1 text-left min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary-400 text-lg sm:text-xl">⚙</span>
            <span className="hidden sm:inline">Filters & Sorting</span>
            <span className="sm:hidden">Filters</span>
          </h3>
          <span className="text-muted-foreground text-lg sm:text-xl transition-transform duration-200 ml-auto flex-shrink-0">
            {expandedSections.filters ? '▼' : '▶'}
          </span>
        </button>
        {expandedSections.filters && (
          <button
            className="text-xs sm:text-sm text-primary-500 hover:text-primary-600 whitespace-nowrap flex-shrink-0"
            onClick={() => setFilters({ search: '', order: 'desc', category: 'all' })}>
            Clear
          </button>
        )}
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expandedSections.filters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
        <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm w-full max-w-full">
          <div className="sm:col-span-2 md:col-span-2 lg:col-span-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
              Search
            </label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Title, address, features..."
              className="mt-1 sm:mt-2 h-9 sm:h-10 md:h-11 w-full px-2 sm:px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
              Sort by
            </label>
            <select
              className="mt-1 sm:mt-2 h-9 sm:h-10 md:h-11 w-full px-2 sm:px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm"
              value="Created Date"
              disabled>
              <option>Created Date</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
              Order
            </label>
            <select
              className="mt-1 sm:mt-2 h-9 sm:h-10 md:h-11 w-full px-2 sm:px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm"
              value={filters.order}
              onChange={(e) => setFilters((prev) => ({ ...prev, order: e.target.value }))}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          {showCategory && (
            <div>
              <label className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
                Category
              </label>
              <select
                className="mt-1 sm:mt-2 h-9 sm:h-10 md:h-11 w-full px-2 sm:px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground text-xs sm:text-sm"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
                <option value="all">All</option>
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="STORAGE">Storage</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderListingsTable = (list: Listing[], showActions = false, isLoading = false) => {
    const tableContent = isLoading ? (
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-surface-secondary border-b border-subtle text-muted-foreground">
          <tr>
            <th className="p-2 sm:p-3 md:p-4 text-left">Title</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden sm:table-cell">Price/month</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden md:table-cell">Size</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden lg:table-cell">Owner</th>
            <th className="p-2 sm:p-3 md:p-4 text-left">Status</th>
            {showActions && <th className="p-2 sm:p-3 md:p-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          <TableRowsSkeleton rows={5} columns={showActions ? 6 : 5} />
        </tbody>
      </table>
    ) : (
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-surface-secondary border-b border-subtle text-muted-foreground">
          <tr>
            <th className="p-2 sm:p-3 md:p-4 text-left">Title</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden sm:table-cell">Price/month</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden md:table-cell">Size</th>
            <th className="p-2 sm:p-3 md:p-4 text-left hidden lg:table-cell">Owner</th>
            <th className="p-2 sm:p-3 md:p-4 text-left">Status</th>
            {showActions && <th className="p-2 sm:p-3 md:p-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td
                colSpan={showActions ? 6 : 5}
                className="p-4 sm:p-6 text-center text-muted-foreground text-xs sm:text-sm">
                No listings found.
              </td>
            </tr>
          ) : (
            list.map((item) => (
              <tr key={item.id} className="border-b border-subtle/60 last:border-none">
                <td className="p-2 sm:p-3 md:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {item.images && item.images.length > 0 && item.images[0] ? (
                      <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-lg overflow-hidden flex-shrink-0 border border-subtle">
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-surface-secondary border border-subtle flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">No img</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${item.id}`}
                        className="font-medium text-foreground hover:text-primary-500 text-xs sm:text-sm truncate block">
                        {item.title}
                      </Link>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {item.address}
                      </p>
                      <div className="sm:hidden mt-1">
                        <span className="text-xs text-muted-foreground">
                          {item.price ? `${item.price.toLocaleString()} ${item.currency}` : '--'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-muted-foreground hidden sm:table-cell">
                  <span className="text-xs sm:text-sm">
                    {item.price ? `${item.price.toLocaleString()} ${item.currency}` : '--'}
                  </span>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-muted-foreground hidden md:table-cell">
                  <span className="text-xs sm:text-sm">{item.area ? `${item.area} m²` : '--'}</span>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-muted-foreground hidden lg:table-cell">
                  <span className="text-xs sm:text-sm truncate block">
                    {item.owner?.name || item.owner?.email || '—'}
                  </span>
                </td>
                <td className="p-2 sm:p-3 md:p-4">
                  <span
                    className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full whitespace-nowrap ${
                      item.status === 'PUBLISHED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : item.status === 'PENDING_REVIEW'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-surface-secondary text-muted-foreground'
                    }`}>
                    {item.status}
                  </span>
                </td>
                {showActions && (
                  <td className="p-2 sm:p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        className="h-8 sm:h-9 px-2 sm:px-4 rounded-xl bg-primary-600 text-white text-[10px] sm:text-xs font-medium hover:bg-primary-700 whitespace-nowrap"
                        onClick={() => handleApproveListing(item.id)}>
                        Approve
                      </button>
                      <button
                        className="h-8 sm:h-9 px-2 sm:px-4 rounded-xl border border-subtle bg-surface-secondary text-[10px] sm:text-xs font-medium text-muted-foreground hover:border-primary-400 whitespace-nowrap"
                        onClick={() => handleReject(item.id)}>
                        Reject
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

    return (
      <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden w-full max-w-full mx-auto flex flex-col flex-1 min-h-0">
        <div className="bg-surface-secondary px-8 py-5 border-b border-subtle flex-shrink-0">
          <button
            onClick={() => toggleSection('listingsTable')}
            className="w-full flex items-center justify-between text-left">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary-400 text-xl">📋</span> Listings Table
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({list.length} {list.length === 1 ? 'item' : 'items'})
              </span>
            </h3>
            <span className="text-muted-foreground text-xl transition-transform duration-200">
              {expandedSections.listingsTable ? '▼' : '▶'}
            </span>
          </button>
        </div>
        {expandedSections.listingsTable && (
          <div className="transition-all duration-300 ease-in-out w-full max-w-full overflow-auto flex-1 min-h-0">
            <div className="min-w-0 min-h-full">{tableContent}</div>
          </div>
        )}
      </section>
    );
  };

  const renderSupport = () => {
    return (
      <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden w-full max-w-full mx-auto relative">
        <div className="bg-surface-secondary px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-subtle">
          <button
            onClick={() => toggleSection('support')}
            className="flex items-center gap-2 flex-1 text-left w-full">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary-400 text-lg sm:text-xl">💬</span>
              <span className="hidden sm:inline">Support Chat</span>
              <span className="sm:hidden">Support</span>
            </h3>
            <span className="text-muted-foreground text-lg sm:text-xl transition-transform duration-200 ml-auto flex-shrink-0">
              {expandedSections.support !== undefined
                ? expandedSections.support
                  ? '▼'
                  : '▶'
                : '▼'}
            </span>
          </button>
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            (expandedSections.support !== undefined ? expandedSections.support : true)
              ? 'max-h-[5000px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}>
          <div className="w-full max-w-full p-4 sm:p-6 md:p-8">
            <AdminSupportChat />
          </div>
        </div>
      </section>
    );
  };

  const filteredIbanSubmissions = useMemo(() => {
    return ibanSubmissions.filter((submission) => {
      if (ibanFilters.search) {
        const searchLower = ibanFilters.search.toLowerCase();
        const matchesSearch =
          submission.email.toLowerCase().includes(searchLower) ||
          submission.iban.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (ibanFilters.fromDate) {
        const fromDate = new Date(ibanFilters.fromDate);
        fromDate.setHours(0, 0, 0, 0);
        const submissionDate = new Date(submission.createdAt);
        submissionDate.setHours(0, 0, 0, 0);
        if (submissionDate < fromDate) return false;
      }

      // Фільтр по даті "до"
      if (ibanFilters.toDate) {
        const toDate = new Date(ibanFilters.toDate);
        toDate.setHours(23, 59, 59, 999);
        const submissionDate = new Date(submission.createdAt);
        if (submissionDate > toDate) return false;
      }

      return true;
    });
  }, [ibanSubmissions, ibanFilters]);

  const exportIbanToCSV = () => {
    const dataToExport =
      filteredIbanSubmissions.length > 0 ? filteredIbanSubmissions : ibanSubmissions;

    if (dataToExport.length === 0) {
      toast.error('No IBAN submissions to export');
      return;
    }

    const headers = ['ID', 'Email', 'IBAN', 'Created At'];

    const csvRows = [
      headers.join(','),
      ...dataToExport.map((submission) => {
        return [
          submission.id,
          `"${submission.email}"`,
          `"${submission.iban}"`,
          `"${new Date(submission.createdAt).toLocaleString()}"`,
        ].join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');

    // Створюємо Blob з CSV даними
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Встановлюємо назву файлу з поточною датою
    const fileName = `iban-submissions-${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `Exported ${dataToExport.length} IBAN submission${
        dataToExport.length !== 1 ? 's' : ''
      } to CSV`,
    );
  };

  const renderIban = () => (
    <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">
          IBAN Submissions
        </h3>
        <button
          className="text-sm sm:text-base text-primary-500 hover:text-primary-600 whitespace-nowrap font-medium"
          onClick={() => {
            refreshData();
            fetchIbanSubmissions();
          }}>
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-sm">
        <input
          type="text"
          value={ibanFilters.search}
          onChange={(e) => setIbanFilters((prev) => ({ ...prev, search: e.target.value }))}
          placeholder="Email, IBAN..."
          className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          type="date"
          value={ibanFilters.fromDate}
          onChange={(e) => setIbanFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
          placeholder="From date"
          className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]"
        />
        <input
          type="date"
          value={ibanFilters.toDate}
          onChange={(e) => setIbanFilters((prev) => ({ ...prev, toDate: e.target.value }))}
          placeholder="To date"
          className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-subtle bg-surface-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:dark]"
        />
      </div>
      {(ibanFilters.search || ibanFilters.fromDate || ibanFilters.toDate) && (
        <div className="flex justify-end">
          <button
            onClick={() => setIbanFilters({ search: '', fromDate: '', toDate: '' })}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            Clear filters
          </button>
        </div>
      )}
      <div className="rounded-2xl border border-subtle bg-surface-secondary p-6 sm:p-8 md:p-10">
        {ibanLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredIbanSubmissions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 sm:py-12">
            <p className="mb-6 text-base sm:text-lg">
              {ibanSubmissions.length === 0
                ? 'No IBAN submissions found'
                : 'No submissions match the current filters'}
            </p>
            {ibanSubmissions.length > 0 && (
              <button
                className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-primary-600 text-white text-sm sm:text-base font-medium hover:bg-primary-700 whitespace-nowrap"
                onClick={exportIbanToCSV}>
                Export All CSV
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-foreground font-semibold text-base sm:text-lg">
                Found {filteredIbanSubmissions.length} submission
                {filteredIbanSubmissions.length !== 1 ? 's' : ''}
                {ibanFilters.search || ibanFilters.fromDate || ibanFilters.toDate
                  ? ` (filtered from ${ibanSubmissions.length} total)`
                  : ''}
              </p>
              <button
                className="h-11 sm:h-12 px-6 sm:px-8 rounded-xl bg-primary-600 text-white text-sm sm:text-base font-medium hover:bg-primary-700 whitespace-nowrap"
                onClick={exportIbanToCSV}>
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-surface border-b border-subtle">
                  <tr>
                    <th className="p-4 sm:p-5 text-left text-muted-foreground font-semibold">
                      Email
                    </th>
                    <th className="p-4 sm:p-5 text-left text-muted-foreground font-semibold hidden sm:table-cell">
                      IBAN
                    </th>
                    <th className="p-4 sm:p-5 text-left text-muted-foreground font-semibold">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIbanSubmissions.map((submission: IbanSubmission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-subtle/60 last:border-none hover:bg-surface-secondary/50 transition-colors">
                      <td className="p-4 sm:p-5 text-foreground text-sm sm:text-base break-all">
                        {submission.email}
                      </td>
                      <td className="p-4 sm:p-5 text-foreground font-mono text-xs sm:text-sm hidden sm:table-cell break-all">
                        {submission.iban}
                      </td>
                      <td className="p-4 sm:p-5 text-muted-foreground text-sm sm:text-base">
                        {new Date(submission.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full text-foreground min-h-screen flex flex-col">
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalListings={stats?.totalListings ?? 0}
        totalApprovals={pendingListings.length}
        totalSupport={supportConversationsMock.length}
        totalIban={ibanSubmissions.length}
        onRefresh={refreshData}
      />

      <div className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-5 md:py-6 flex flex-col min-h-0">
        <div className="space-y-8 w-full flex-1 flex flex-col">
          {activeTab === 'listings' && (
            <>
              {renderCreateForm()}
              {renderFilters()}
              {allListingsError && (
                <div className="rounded-3xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
                  <p className="font-semibold">Помилка завантаження listings:</p>
                  <p className="text-sm mt-1">
                    {allListingsErrorDetails?.message || 'Невідома помилка'}
                  </p>
                  <button
                    onClick={() => refetchAllListings()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                    Спробувати ще раз
                  </button>
                </div>
              )}
              {renderListingsTable(filteredListings, false, allListingsLoading)}
            </>
          )}

          {activeTab === 'approvals' && (
            <div className="flex-1 flex flex-col min-h-0 space-y-8">
              {renderFilters(false)}
              <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden w-full max-w-full mx-auto relative">
                <div className="bg-surface-secondary px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-subtle">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      <span className="text-primary-400 text-lg sm:text-xl">✓</span>
                      <span className="hidden sm:inline">Approve All Pending</span>
                      <span className="sm:hidden">Approve All</span>
                    </h3>
                  </div>
                </div>
                <div className="p-8 sm:p-10 md:p-12">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base text-muted-foreground mb-2">
                        Approve all pending listings at once
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground/70">
                        {pendingListings.length > 0
                          ? `${pendingListings.length} listing${
                              pendingListings.length !== 1 ? 's' : ''
                            } pending approval`
                          : 'No pending listings'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={handleApproveAll}
                        disabled={!pendingListings.length}
                        className="h-12 sm:h-14 px-8 sm:px-10 rounded-xl bg-primary-600 text-white text-base sm:text-lg font-semibold shadow hover:bg-primary-700 disabled:opacity-50 whitespace-nowrap transition-all">
                        Approve all pending
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <div className="flex-1 min-h-0">
                {renderListingsTable(pendingListings, true, pendingListingsLoading)}
              </div>
            </div>
          )}

          {activeTab === 'support' && renderSupport()}

          {activeTab === 'iban' && renderIban()}
        </div>
      </div>
    </div>
  );
}
