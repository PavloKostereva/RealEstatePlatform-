import dynamic from 'next/dynamic';

// Lazy load адмін панель - вона велика і не потрібна одразу
const AdminDashboardGate = dynamic(
  () => import('@/components/admin/AdminDashboardGate'),
  {
    loading: () => (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    ),
  }
);

export default function AdminPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AdminDashboardGate />
    </div>
  );
}
