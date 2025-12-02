import { getRequestConfig } from 'next-intl/server';

export const locales = ['uk', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const validLocale = locale && locales.includes(locale as Locale) ? (locale as Locale) : 'en';
  try {
    const messagesModule = await import(`./messages/${validLocale}.json`);

    return {
      locale: validLocale,
      messages: messagesModule.default,
    };
  } catch (error) {
    console.error(`Failed to load messages for locale ${validLocale}:`, error);
    const fallbackMessages = await import(`./messages/en.json`);
    return {
      locale: 'en',
      messages: fallbackMessages.default,
    };
  }
});
