'use client';

import { useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('home');

  return (
    <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg p-6 mb-6">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm md:text-base mb-4 text-primary-100">{t('subtitle')}</p>
      </div>
    </div>
  );
}
