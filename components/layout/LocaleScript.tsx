'use client';

import { useEffect } from 'react';

interface LocaleScriptProps {
  locale: string;
}

export function LocaleScript({ locale }: LocaleScriptProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
