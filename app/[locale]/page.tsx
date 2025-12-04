import { SearchFilters } from '@/components/search/SearchFilters'
import { Hero } from '@/components/home/Hero'
import dynamic from 'next/dynamic'

// Lazy load важкий компонент з картою
const HomeMapWithListings = dynamic(
  () => import('@/components/home/HomeMapWithListings').then((mod) => ({ default: mod.HomeMapWithListings })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    ),
    ssr: false, // Карта не потребує SSR
  }
)

export default async function HomePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Hero />
      <SearchFilters useLocalFilters={true} />
      <HomeMapWithListings />
    </div>
  )
}
