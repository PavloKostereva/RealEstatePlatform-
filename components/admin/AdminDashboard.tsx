'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminStats, useAdminListings } from '@/hooks/useAdmin';
import { TableRowsSkeleton } from '@/components/skeletons/TableRowsSkeleton';
import { StatsSkeleton } from '@/components/skeletons/StatsSkeleton';
import { AdminSupportChat } from './AdminSupportChat';
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
  const router = useRouter();
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
  const [expandedSections, setExpandedSections] = useState({
    createForm: false,
    filters: true,
    listingsTable: true,
    support: true,
  });

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
  const { data: statsData, refetch: refetchStats, isLoading: statsLoading } = useAdminStats();
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
    isError: pendingListingsError,
  } = useAdminListings('PENDING_REVIEW');

  // Синхронізуємо дані з React Query
  useEffect(() => {
    if (statsData) setStats(statsData);
  }, [statsData]);

  // Завантажуємо IBAN submissions
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
      setAllListings(allListingsData);
    } else if (!allListingsLoading && (allListingsData === null || allListingsData === undefined)) {
      setAllListings([]);
    }
  }, [allListingsData, allListingsLoading, allListingsError, allListingsErrorDetails]);

  useEffect(() => {
    if (pendingListingsData && Array.isArray(pendingListingsData)) {
      setPendingListings(pendingListingsData);
    } else if (pendingListingsData === null || pendingListingsData === undefined) {
      setPendingListings([]);
    }
  }, [pendingListingsData]);

  // Мемоізуємо функцію refresh
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

  const handleSignOut = () => {
    router.push('/how-it-works?logout=true');
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

  const renderTabs = () => (
    <div className="flex gap-2 border border-subtle rounded-2xl bg-surface-secondary p-1 w-fit">
      {[
        { key: 'listings', label: 'Listings' },
        { key: 'approvals', label: 'Approvals' },
        { key: 'support', label: 'Support' },
        { key: 'iban', label: 'IBAN' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key as typeof activeTab)}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
            activeTab === key
              ? 'bg-primary-600 text-white shadow'
              : 'text-muted-foreground hover:bg-surface'
          }`}>
          {label}
        </button>
      ))}
    </div>
  );

  const renderSummary = () => {
    const getTotal = () => {
      if (activeTab === 'approvals') return pendingListings.length;
      if (activeTab === 'support') return supportConversationsMock.length;
      if (activeTab === 'iban') return ibanSubmissions.length;
      return stats?.totalListings ?? 0;
    };

    return (
      <div className="flex items-center gap-4 justify-between min-h-[44px]">
        <div className="text-muted-foreground text-sm whitespace-nowrap">
          Total: {getTotal()}
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={refreshData}
            className="h-10 px-4 rounded-xl border border-subtle bg-surface-secondary text-sm text-foreground hover:border-primary-400 whitespace-nowrap">
            Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 whitespace-nowrap">
            Sign out
          </button>
        </div>
      </div>
    );
  };

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
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderCreateForm = () => (
    <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
      <div className="bg-surface-secondary px-6 py-4 border-b border-subtle">
        <button
          onClick={() => toggleSection('createForm')}
          className="w-full flex items-center justify-between text-left">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary-400 text-xl">＋</span> Create New Self-Storage Listing
          </h2>
          <span className="text-muted-foreground text-xl transition-transform duration-200">
            {expandedSections.createForm ? '▼' : '▶'}
          </span>
        </button>
      </div>
      {expandedSections.createForm && (
        <div className="p-6 grid lg:grid-cols-[1.2fr,1fr] gap-6 transition-all duration-300 ease-in-out">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Indoor Self-Storage Unit"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subtitle</label>
              <input
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="Short description (e.g. climate controlled)"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price/month (€)</label>
                <input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1200"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Size (m²)</label>
                <input
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="10"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Image URL</label>
                <input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City"
                className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Features</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {featurePresets.map(renderFeatureChip)}
                <button
                  type="button"
                  onClick={toggleFeatureList}
                  className="px-3 py-1.5 rounded-xl text-sm border border-subtle bg-surface-secondary text-muted-foreground hover:border-primary-400">
                  {showMoreFeatures ? 'Show less' : 'See more'}
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lat</label>
                <input
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="Lat"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lng</label>
                <input
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="Lng"
                  className="mt-1 w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateListing}
                  disabled={createLoading}
                  className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-60">
                  {createLoading ? 'Saving...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-subtle bg-surface-secondary p-6 flex flex-col gap-4 items-center justify-center text-sm text-muted-foreground">
            <div className="h-32 w-32 bg-surface rounded-xl border border-subtle flex items-center justify-center">
              {formData.imageUrl ? (
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  width={120}
                  height={120}
                  className="rounded-xl object-cover"
                />
              ) : (
                <span>No preview</span>
              )}
            </div>
            <p className="text-center">
              Drag & Drop or provide an image URL to showcase the listing.
            </p>
            <div className="flex gap-2">
              <button
                className="h-10 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium shadow hover:bg-primary-700"
                onClick={handleUploadClick}>
                Upload
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-xl border border-subtle bg-surface text-sm text-foreground"
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
      )}
    </section>
  );

  const renderFilters = (showCategory = true) => (
    <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
      <div className="bg-surface-secondary px-6 py-4 border-b border-subtle flex items-center justify-between">
        <button
          onClick={() => toggleSection('filters')}
          className="flex items-center gap-2 flex-1 text-left">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-primary-400 text-xl">⚙</span> Filters & Sorting
          </h3>
          <span className="text-muted-foreground text-xl transition-transform duration-200 ml-auto">
            {expandedSections.filters ? '▼' : '▶'}
          </span>
        </button>
        {expandedSections.filters && (
          <button
            className="text-sm text-primary-500 hover:text-primary-600"
            onClick={() => setFilters({ search: '', order: 'desc', category: 'all' })}>
            Clear Filters
          </button>
        )}
      </div>
      {expandedSections.filters && (
        <div className="p-6 grid md:grid-cols-5 gap-4 text-sm transition-all duration-300 ease-in-out">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Search
            </label>
            <input
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Title, address, features..."
              className="mt-2 h-11 w-full px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Sort by
            </label>
            <select
              className="mt-2 h-11 w-full px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
              value="Created Date"
              disabled>
              <option>Created Date</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Order</label>
            <select
              className="mt-2 h-11 w-full px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
              value={filters.order}
              onChange={(e) => setFilters((prev) => ({ ...prev, order: e.target.value }))}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
          {showCategory && (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Category
              </label>
              <select
                className="mt-2 h-11 w-full px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
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
      )}
    </section>
  );

  const renderListingsTable = (list: Listing[], showActions = false, isLoading = false) => {
    const tableContent = isLoading ? (
      <table className="w-full text-sm">
        <thead className="bg-surface-secondary border-b border-subtle text-muted-foreground">
          <tr>
            <th className="p-4 text-left">Title</th>
            <th className="p-4 text-left">Price/month</th>
            <th className="p-4 text-left">Size</th>
            <th className="p-4 text-left">Owner</th>
            <th className="p-4 text-left">Status</th>
            {showActions && <th className="p-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          <TableRowsSkeleton rows={5} columns={showActions ? 6 : 5} />
        </tbody>
      </table>
    ) : (
      <table className="w-full text-sm">
        <thead className="bg-surface-secondary border-b border-subtle text-muted-foreground">
          <tr>
            <th className="p-4 text-left">Title</th>
            <th className="p-4 text-left">Price/month</th>
            <th className="p-4 text-left">Size</th>
            <th className="p-4 text-left">Owner</th>
            <th className="p-4 text-left">Status</th>
            {showActions && <th className="p-4 text-left">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 6 : 5} className="p-6 text-center text-muted-foreground">
                No listings found.
              </td>
            </tr>
          ) : (
            list.map((item) => (
              <tr key={item.id} className="border-b border-subtle/60 last:border-none">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {item.images && item.images.length > 0 && item.images[0] ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border border-subtle">
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-surface-secondary border border-subtle flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No img</span>
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/listings/${item.id}`}
                        className="font-medium text-foreground hover:text-primary-500">
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.address}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">
                  {item.price ? `${item.price.toLocaleString()} ${item.currency}` : '--'}
                </td>
                <td className="p-4 text-muted-foreground">
                  {item.area ? `${item.area} m²` : '--'}
                </td>
                <td className="p-4 text-muted-foreground">
                  {item.owner?.name || item.owner?.email || '—'}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
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
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        className="h-9 px-4 rounded-xl bg-primary-600 text-white text-xs font-medium hover:bg-primary-700"
                        onClick={() => handleApproveListing(item.id)}>
                        Approve
                      </button>
                      <button
                        className="h-9 px-4 rounded-xl border border-subtle bg-surface-secondary text-xs font-medium text-muted-foreground hover:border-primary-400"
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
      <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
        <div className="bg-surface-secondary px-6 py-4 border-b border-subtle">
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
          <div className="transition-all duration-300 ease-in-out">{tableContent}</div>
        )}
      </section>
    );
  };

  const renderSupport = () => {
    return (
      <section className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden">
        <div className="bg-surface-secondary px-6 py-4 border-b border-subtle">
          <button
            onClick={() => toggleSection('support')}
            className="flex items-center gap-2 flex-1 text-left w-full">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="text-primary-400 text-xl">💬</span> Support Chat
            </h3>
            <span className="text-muted-foreground text-xl transition-transform duration-200 ml-auto">
              {expandedSections.support !== undefined
                ? expandedSections.support
                  ? '▼'
                  : '▶'
                : '▼'}
            </span>
          </button>
        </div>
        {(expandedSections.support !== undefined ? expandedSections.support : true) && (
          <div className="transition-all duration-300 ease-in-out">
            <AdminSupportChat />
          </div>
        )}
      </section>
    );
  };

  const exportIbanToCSV = () => {
    if (ibanSubmissions.length === 0) {
      toast.error('No IBAN submissions to export');
      return;
    }

    // Заголовки CSV
    const headers = ['ID', 'Email', 'IBAN', 'Created At'];
    
    // Конвертуємо дані в CSV формат
    const csvRows = [
      headers.join(','),
      ...ibanSubmissions.map((submission) => {
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
    
    toast.success('IBAN submissions exported successfully');
  };

  const renderIban = () => (
    <div className="rounded-3xl border border-subtle bg-surface shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">IBAN Submissions</h3>
        <button
          className="text-sm text-primary-500 hover:text-primary-600"
          onClick={() => {
            refreshData();
            fetchIbanSubmissions();
          }}>
          Refresh
        </button>
      </div>
      <div className="grid md:grid-cols-3 gap-4 text-sm">
        <input
          placeholder="Email, IBAN..."
          className="h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
        />
        <input
          placeholder="From date"
          className="h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
        />
        <input
          placeholder="To date"
          className="h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground"
        />
      </div>
      <div className="rounded-2xl border border-subtle bg-surface-secondary p-8">
        {ibanLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : ibanSubmissions.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p className="mb-4">No IBAN submissions found</p>
            <button
              className="h-10 px-4 rounded-xl border border-subtle bg-surface text-sm text-foreground hover:border-primary-400"
              onClick={exportIbanToCSV}
              disabled>
              Export CSV
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-foreground font-medium">
                Found {ibanSubmissions.length} submission{ibanSubmissions.length !== 1 ? 's' : ''}
              </p>
              <button
                className="h-10 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
                onClick={exportIbanToCSV}>
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-subtle">
                  <tr>
                    <th className="p-3 text-left text-muted-foreground">Email</th>
                    <th className="p-3 text-left text-muted-foreground">IBAN</th>
                    <th className="p-3 text-left text-muted-foreground">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {ibanSubmissions.map((submission: IbanSubmission) => (
                    <tr key={submission.id} className="border-b border-subtle/60 last:border-none">
                      <td className="p-3 text-foreground">{submission.email}</td>
                      <td className="p-3 text-foreground font-mono text-xs">{submission.iban}</td>
                      <td className="p-3 text-muted-foreground">
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
    <div className="max-w-7xl mx-auto py-10 text-foreground">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-subtle pb-4 mb-6 -mx-4 px-4 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold whitespace-nowrap">Admin Dashboard</h1>
          <div className="flex-shrink-0">
            {renderTabs()}
          </div>
        </div>
        {renderSummary()}
      </div>

      <div className="space-y-8">
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
          <>
            {renderFilters(false)}
            <div className="flex justify-end -mt-4 mb-4">
              <button
                onClick={handleApproveAll}
                disabled={!pendingListings.length}
                className="h-10 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium shadow hover:bg-primary-700 disabled:opacity-50">
                Approve all pending
              </button>
            </div>
            {renderListingsTable(pendingListings, true, pendingListingsLoading)}
          </>
        )}

        {activeTab === 'support' && renderSupport()}

        {activeTab === 'iban' && renderIban()}
      </div>
    </div>
  );
}
