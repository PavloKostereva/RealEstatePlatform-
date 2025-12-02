'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-subtle bg-surface-secondary/70 px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <Link href="/" className="text-xl font-semibold text-foreground">
              RealEstate
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Rent premium listings for the exact time you need. Simple pricing, instant checkout.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground uppercase tracking-widest">
            <div className="space-y-2">
              <p className="text-foreground">Explore</p>
              <ul className="space-y-1 normal-case tracking-normal">
              <li>
                  <Link href="/listings" className="hover:text-primary-500">
                    Listings
                </Link>
              </li>
              <li>
                  <Link href="/how-it-works" className="hover:text-primary-500">
                    How it works
                </Link>
              </li>
              <li>
                  <Link href="/support" className="hover:text-primary-500">
                    Support
                </Link>
              </li>
            </ul>
          </div>
            <div className="space-y-2">
              <p className="text-foreground">Legal</p>
              <ul className="space-y-1 normal-case tracking-normal">
                <li>
                  <Link href="/terms" className="hover:text-primary-500">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary-500">
                    Privacy
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@realestate.com" className="hover:text-primary-500">
                    Email support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
