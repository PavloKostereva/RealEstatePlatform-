'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function NotFound() {
  const locale = useLocale()
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-600 mb-8">Сторінку не знайдено</p>
      <Link href={`/${locale}`} className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700">
        На головну
      </Link>
    </div>
  )
}

