'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function TermsContent() {
  const t = useTranslations('terms');
  const locale = useLocale();

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path === '/' ? '' : path}`;
  };

  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Main Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{t('description')}</p>
          <button
            onClick={() => alert(t('pdfAlert'))}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v6h6"
              />
            </svg>
            {t('viewFullTerms')}
          </button>
        </div>

        {/* Detailed Terms Section */}
        <div className="rounded-2xl border border-subtle bg-surface-secondary p-8 space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                1. {t('acceptance.title')}
              </h3>
              <p className="text-muted-foreground">{t('acceptance.description')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                2. {t('payments.title')}
              </h3>
              <p className="text-muted-foreground">{t('payments.description')}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                3. {t('liability.title')}
              </h3>
              <p className="text-muted-foreground">{t('liability.description')}</p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Section */}
        <div className="rounded-2xl border border-subtle bg-surface-secondary p-8 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{t('privacy.title')}</h2>
          <p className="text-muted-foreground">{t('privacy.description')}</p>
          <Link
            href={getLocalizedPath('/privacy')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-subtle bg-surface text-foreground font-medium hover:border-primary-400 hover:text-primary-600 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {t('privacy.viewFull')}
          </Link>
        </div>
      </div>
    </div>
  );
}


