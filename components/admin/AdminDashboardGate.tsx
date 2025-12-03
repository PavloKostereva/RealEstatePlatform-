'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut, signIn } from 'next-auth/react';
import { AdminDashboard } from './AdminDashboard';
import { useToast } from '@/components/ui/ToastContainer';

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'realestate-admin';

export default function AdminDashboardGate() {
  const { data: session, update } = useSession();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.trim() === ADMIN_PASS) {
      // Якщо користувач не має ролі ADMIN, спробуємо оновити роль
      if (session?.user?.role !== 'ADMIN') {
        setUpdatingRole(true);
        try {
          const res = await fetch(`/api/users/${session?.user?.id}/update-role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ role: 'ADMIN' }),
          });

          if (res.ok) {
            toast.success('Роль успішно оновлено на ADMIN. Оновлюємо сесію...');
            // Оновлюємо сесію - це викличе JWT callback з trigger: 'update'
            await update();
            // Даємо час на оновлення сесії
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Перезавантажуємо сторінку для повного оновлення сесії
            window.location.reload();
          } else {
            const errorData = await res.json();
            setError(errorData.error || 'Не вдалося оновити роль');
          }
        } catch (err) {
          console.error('Error updating role:', err);
          setError('Помилка при оновленні ролі');
        } finally {
          setUpdatingRole(false);
        }
      } else {
        setAuthorized(true);
        setError(null);
      }
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  // Перевіряємо, чи користувач вже має роль ADMIN
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setAuthorized(true);
    }
  }, [session]);

  if (authorized) {
    return <AdminDashboard />;
  }

  return (
    <div className="max-w-md mx-auto bg-surface rounded-3xl border border-subtle shadow-lg p-8 text-center space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This dashboard is protected. Enter the admin password to proceed.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full h-11 px-4 rounded-xl border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={updatingRole}
          className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {updatingRole ? 'Оновлення ролі...' : 'Unlock Dashboard'}
        </button>
      </form>
      <p className="text-xs text-muted-foreground">
        * Default demo password:{' '}
        <code className="bg-surface-secondary px-2 py-1 rounded">{ADMIN_PASS}</code>
      </p>
    </div>
  );
}
