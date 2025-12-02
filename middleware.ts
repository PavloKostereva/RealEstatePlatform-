import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Прибирає /en для дефолтної локалі
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
