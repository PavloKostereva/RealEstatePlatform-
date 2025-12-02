'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SignInModal } from '@/components/layout/SignInModal';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const t = useTranslations('common');
  const locale = useLocale();

  // Мемоізуємо функцію getLocalizedPath
  const getLocalizedPath = useCallback(
    (path: string) => {
      // Для дефолтної локалі (en) не додаємо префікс
      if (locale === 'en') {
        return path === '/' ? '/' : path;
      }
      // Для інших локалей додаємо префікс
      return `/${locale}${path === '/' ? '' : path}`;
    },
    [locale],
  );

  // Мемоізуємо функцію isActive
  const isActive = useCallback(
    (path: string) => {
      const localizedPath = getLocalizedPath(path);

      // Для головної сторінки перевіряємо точну відповідність
      if (path === '/') {
        if (locale === 'en') {
          return pathname === '/' || pathname === '';
        }
        return (
          pathname === localizedPath || pathname === `/${locale}` || pathname === `/${locale}/`
        );
      }

      // Для інших шляхів перевіряємо, що pathname починається з шляху
      if (locale === 'en') {
        return pathname === localizedPath || pathname?.startsWith(localizedPath + '/');
      }
      return pathname === localizedPath || pathname?.startsWith(localizedPath + '/');
    },
    [pathname, locale, getLocalizedPath],
  );

  // Мемоізуємо шляхи для навігації
  const navPaths = useMemo(
    () => ({
      home: getLocalizedPath('/'),
      listings: getLocalizedPath('/listings'),
      howItWorks: getLocalizedPath('/how-it-works'),
      myListings: getLocalizedPath('/my-listings'),
      admin: getLocalizedPath('/admin'),
      profile: getLocalizedPath('/profile'),
    }),
    [getLocalizedPath],
  );

  // Мемоізуємо активні стани
  const activeStates = useMemo(
    () => ({
      home: isActive('/'),
      listings: isActive('/listings'),
      howItWorks: isActive('/how-it-works'),
      myListings: isActive('/my-listings'),
      admin: isActive('/admin'),
      profile: isActive('/profile'),
    }),
    [isActive],
  );

  const openModal = useCallback(() => setShowSignInModal(true), []);
  const closeModal = useCallback(() => setShowSignInModal(false), []);

  const handleSignOut = useCallback(() => {
    signOut({ redirect: false });
    router.push(getLocalizedPath('/'));
  }, [router, getLocalizedPath]);

  return (
    <>
      <nav className="bg-surface shadow-lg border-b border-subtle transition-colors sticky top-0 z-50 backdrop-blur-sm bg-surface/95">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link
              href={navPaths.home}
              prefetch={true}
              className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              RealEstate
            </Link>

            {/* Навігаційні кнопки посередині */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href={navPaths.home}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStates.home
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}>
                {t('home')}
              </Link>
              <Link
                href={navPaths.listings}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStates.listings
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}>
                {t('listings')}
              </Link>
              <Link
                href={navPaths.howItWorks}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStates.howItWorks
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}>
                {t('howItWorks')}
              </Link>
              <Link
                href={navPaths.myListings}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeStates.myListings
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}>
                {t('myListings')}
              </Link>
              {session?.user.role === 'ADMIN' && (
                <Link
                  href={navPaths.admin}
                  prefetch={true}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeStates.admin
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                  }`}>
                  {t('admin')}
                </Link>
              )}
            </div>

            {/* Кнопки справа: email, тема, профіль, вихід/вхід */}
            <div className="hidden md:flex items-center space-x-2">
              {session && (
                <span className="text-sm text-muted-foreground mr-2">{session.user.email}</span>
              )}
              <div>
                <ThemeToggle />
              </div>
              {session ? (
                <>
                  <Link
                    href={navPaths.profile}
                    prefetch={true}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeStates.profile
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                    }`}>
                    {t('profile')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md">
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <button
                  onClick={openModal}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md">
                  {t('signIn')}
                </button>
              )}
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 space-y-1 border-t border-subtle mt-2">
              <Link
                href={navPaths.home}
                prefetch={true}
                className={`block px-4 py-2 rounded-lg transition-all ${
                  activeStates.home
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {t('home')}
              </Link>
              <Link
                href={navPaths.listings}
                prefetch={true}
                className={`block px-4 py-2 rounded-lg transition-all ${
                  activeStates.listings
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {t('listings')}
              </Link>
              <Link
                href={navPaths.howItWorks}
                prefetch={true}
                className={`block px-4 py-2 rounded-lg transition-all ${
                  activeStates.howItWorks
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {t('howItWorks')}
              </Link>
              <Link
                href={navPaths.myListings}
                prefetch={true}
                className={`block px-4 py-2 rounded-lg transition-all ${
                  activeStates.myListings
                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                    : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {t('myListings')}
              </Link>
              {session?.user.role === 'ADMIN' && (
                <Link
                  href={navPaths.admin}
                  prefetch={true}
                  className={`block px-4 py-2 rounded-lg transition-all ${
                    activeStates.admin
                      ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                      : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                  }`}
                  onClick={() => setIsMenuOpen(false)}>
                  {t('admin')}
                </Link>
              )}

              {/* Розділювач для кнопок */}
              <div className="border-t border-subtle my-2"></div>

              {session ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    {session.user.email}
                  </div>
                  <div className="px-4 py-2">
                    <ThemeToggle />
                  </div>
                  <Link
                    href={navPaths.profile}
                    prefetch={true}
                    className={`block px-4 py-2 rounded-lg transition-all ${
                      activeStates.profile
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 font-medium'
                        : 'text-muted-foreground hover:text-primary-600 hover:bg-surface-secondary'
                    }`}
                    onClick={() => setIsMenuOpen(false)}>
                    {t('profile')}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all">
                    {t('signOut')}
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-2">
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={() => {
                      openModal();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all">
                    {t('signIn')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      <SignInModal open={showSignInModal} onClose={closeModal} />
    </>
  );
}
