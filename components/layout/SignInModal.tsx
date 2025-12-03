'use client';

import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { signIn } from 'next-auth/react';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    alert(
      `Demo only: ${
        authMethod === 'magic' ? 'Send magic link to' : 'Sign in with password for'
      } ${email}`,
    );
  };

  const handleGoogleSignIn = async () => {
    try {
      const callbackUrl = typeof window !== 'undefined' ? window.location.origin : '/';
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleDiscordSignIn = async () => {
    try {
      const callbackUrl = typeof window !== 'undefined' ? window.location.origin : '/';
      await signIn('discord', { callbackUrl });
    } catch (error) {
      console.error('Error signing in with Discord:', error);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      const callbackUrl = typeof window !== 'undefined' ? window.location.origin : '/';
      await signIn('linkedin', { callbackUrl });
    } catch (error) {
      console.error('Error signing in with LinkedIn:', error);
    }
  };

  const socialButtons = [
    { label: 'Google', icon: 'G', onClick: handleGoogleSignIn },
    { label: 'Discord', icon: '💬', onClick: handleDiscordSignIn },
    { label: 'LinkedIn', icon: 'in', onClick: handleLinkedInSignIn },
  ];

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-subtle bg-surface shadow-2xl text-foreground">
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-lg font-semibold">Sign in or sign up</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-primary-500 text-xl font-semibold">
            ×
          </button>
        </div>

        <div className="px-6 pt-4 pb-6 space-y-6">
          <p className="text-sm text-muted-foreground">Select how you want to authenticate.</p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Sign in with:</p>
            <div className="grid grid-cols-3 gap-3">
              {socialButtons.map(({ label, icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="h-11 rounded-xl border border-subtle bg-surface-secondary text-sm font-medium text-foreground hover:border-primary-400 flex items-center justify-center gap-2">
                  <span className="text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-subtle" aria-hidden="true" />
            OR
            <span className="h-px flex-1 bg-subtle" aria-hidden="true" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sign in with email</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('magic')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition ${
                    authMethod === 'magic'
                      ? 'bg-primary-600 text-white shadow'
                      : 'border border-subtle bg-surface-secondary text-muted-foreground'
                  }`}>
                  Magic link
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`flex-1 h-10 rounded-xl text-sm font-medium transition ${
                    authMethod === 'password'
                      ? 'bg-primary-600 text-white shadow'
                      : 'border border-subtle bg-surface-secondary text-muted-foreground'
                  }`}>
                  Password
                </button>
              </div>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />

            {authMethod === 'password' && (
              <input
                type="password"
                placeholder="Your password"
                className="w-full h-11 px-3 rounded-xl border border-subtle bg-surface-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary-600 text-white font-semibold shadow hover:bg-primary-700">
              {authMethod === 'magic' ? 'Send sign-in link' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
