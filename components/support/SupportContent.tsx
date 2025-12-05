'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { SupportChat } from '@/components/profile/SupportChat';

export function SupportContent() {
  const t = useTranslations('support');
  const locale = useLocale();
  const { data: session } = useSession();

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path === '/' ? '' : path}`;
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="rounded-2xl border border-subtle bg-surface-secondary p-8 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>

          {!session && (
          <div className="space-y-2">
            <p className="text-foreground">
              <span className="font-medium">{t('email')}: </span>
              <a
                href={`mailto:${t('emailAddress')}`}
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                {t('emailAddress')}
              </a>
            </p>
            <p className="text-muted-foreground">{t('responseTime')}</p>
          </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href={getLocalizedPath('/')}
              className="flex-1 px-6 py-3 rounded-xl border border-subtle bg-surface text-foreground font-medium hover:border-primary-400 hover:text-primary-600 transition text-center"
            >
              {t('backToHome')}
            </Link>
            {!session && (
            <a
              href={`mailto:${t('emailAddress')}`}
              className="flex-1 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition text-center"
            >
              {t('emailSupport')}
            </a>
            )}
          </div>
        </div>

        {/* Chat Section for authenticated users */}
        {session ? (
          <div className="rounded-2xl border border-subtle bg-surface-secondary p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Chat with Support</h2>
              <p className="text-muted-foreground">
                Start a conversation with our support team. We'll respond as soon as possible.
              </p>
            </div>
            <SupportChat />
          </div>
        ) : (
          <div className="rounded-2xl border border-subtle bg-surface-secondary p-8 text-center">
            <p className="text-foreground mb-4">
              Please sign in to access the support chat
            </p>
            <Link
              href={getLocalizedPath('/auth/signin')}
              className="inline-block px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


