'use client';

import { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'realestate-admin';

export default function AdminDashboardGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password.trim() === ADMIN_PASS) {
      setAuthorized(true);
      setError(null);
    } else {
      setError('Invalid password. Please try again.');
    }
  };

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
          className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700"
        >
          Unlock Dashboard
        </button>
      </form>
      <p className="text-xs text-muted-foreground">
        * Default demo password: <code className="bg-surface-secondary px-2 py-1 rounded">{ADMIN_PASS}</code>
      </p>
    </div>
  );
}

