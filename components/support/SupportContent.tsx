'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function SupportContent() {
  const t = useTranslations('support');
  const locale = useLocale();

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path === '/' ? '' : path}`;
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-subtle bg-surface-secondary p-8 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>

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

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href={getLocalizedPath('/')}
              className="flex-1 px-6 py-3 rounded-xl border border-subtle bg-surface text-foreground font-medium hover:border-primary-400 hover:text-primary-600 transition text-center"
            >
              {t('backToHome')}
            </Link>
            <a
              href={`mailto:${t('emailAddress')}`}
              className="flex-1 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition text-center"
            >
              {t('emailSupport')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


