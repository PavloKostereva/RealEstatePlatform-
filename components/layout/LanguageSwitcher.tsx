'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { locales } from '@/i18n'

const localeNames: Record<string, string> = {
  uk: 'UK',
  en: 'EN',
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Видаляємо поточну локаль з шляху
    let pathWithoutLocale = pathname;
    if (locale !== 'en' && pathname.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    } else if (locale === 'en' && !pathname.startsWith('/uk')) {
      pathWithoutLocale = pathname || '/';
    }
    
    // Додаємо нову локаль (тільки якщо це не дефолтна локаль)
    if (newLocale === 'en') {
      router.push(pathWithoutLocale || '/');
    } else {
      router.push(`/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`);
    }
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        className="w-full appearance-none bg-surface-secondary border border-subtle rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeNames[loc] || loc.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  )
}

