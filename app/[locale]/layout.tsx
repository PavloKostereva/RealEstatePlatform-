import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Providers } from '@/components/providers';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SuspenseFallback } from '@/components/SuspenseFallback';
import { LocaleScript } from '@/components/layout/LocaleScript';

export const metadata: Metadata = {
  title: 'Real Estate Platform',
  description: 'Платформа для оренди та купівлі нерухомості',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = resolvedParams?.locale || 'en';
  const validLocale = locales.includes(locale as (typeof locales)[number]) ? locale : 'en';

  setRequestLocale(validLocale);

  // Оптимізоване завантаження повідомлень
  const messages = await getMessages();

  return (
    <ErrorBoundary>
      <NextIntlClientProvider messages={messages} locale={validLocale}>
        <LocaleScript locale={validLocale} />
        <Providers>
          <Suspense fallback={<SuspenseFallback />}>
            <ConditionalLayout>{children}</ConditionalLayout>
          </Suspense>
        </Providers>
      </NextIntlClientProvider>
    </ErrorBoundary>
  );
}
