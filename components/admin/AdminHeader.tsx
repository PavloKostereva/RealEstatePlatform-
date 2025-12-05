'use client';

import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  activeTab: 'listings' | 'approvals' | 'support' | 'iban';
  onTabChange: (tab: 'listings' | 'approvals' | 'support' | 'iban') => void;
  totalListings?: number;
  totalApprovals?: number;
  totalSupport?: number;
  totalIban?: number;
  onRefresh?: () => void;
}

export function AdminHeader({
  activeTab,
  onTabChange,
  totalListings = 0,
  totalApprovals = 0,
  totalSupport = 0,
  totalIban = 0,
  onRefresh,
}: AdminHeaderProps) {
  const router = useRouter();

  const getTotal = () => {
    if (activeTab === 'approvals') return totalApprovals;
    if (activeTab === 'support') return totalSupport;
    if (activeTab === 'iban') return totalIban;
    return totalListings;
  };

  const handleSignOut = () => {
    router.push('/how-it-works?logout=true');
  };

  const renderTabs = () => (
    <div className="flex gap-1 sm:gap-2 border border-subtle rounded-2xl bg-surface-secondary p-1 w-full sm:w-auto overflow-x-auto">
      {[
        { key: 'listings', label: 'Listings', shortLabel: 'List' },
        { key: 'approvals', label: 'Approvals', shortLabel: 'Appr' },
        { key: 'support', label: 'Support', shortLabel: 'Sup' },
        { key: 'iban', label: 'IBAN', shortLabel: 'IBAN' },
      ].map(({ key, label, shortLabel }) => (
        <button
          key={key}
          onClick={() => onTabChange(key as typeof activeTab)}
          className={`flex-1 sm:flex-initial px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition whitespace-nowrap ${
            activeTab === key
              ? 'bg-primary-600 text-white shadow'
              : 'text-muted-foreground hover:bg-surface'
          }`}>
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="sticky top-0 z-50 bg-background border-b border-subtle shadow-sm w-full">
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 pt-4 sm:pt-5 md:pt-6 pb-3 sm:pb-4 h-[140px] sm:h-[160px] flex flex-col justify-between overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0 h-auto min-h-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold whitespace-nowrap flex-shrink-0">
            Admin Dashboard
          </h1>
          <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[400px]">{renderTabs()}</div>
        </div>
        <div className="flex-shrink-0 h-[44px] flex items-center">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 justify-between w-full h-full">
            <div className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
              Total: {getTotal()}
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={onRefresh}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border border-subtle bg-surface-secondary text-xs sm:text-sm text-foreground hover:border-primary-400 whitespace-nowrap flex-1 sm:flex-initial">
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-semibold hover:bg-red-700 whitespace-nowrap flex-1 sm:flex-initial">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
