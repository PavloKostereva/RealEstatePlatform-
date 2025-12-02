import dynamic from 'next/dynamic'

// Lazy load ListingGrid для кращої продуктивності
const ListingGrid = dynamic(
  () => import('@/components/listings/ListingGrid').then((mod) => ({ default: mod.ListingGrid })),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    ),
  }
)

export default function ListingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ListingGrid />
    </div>
  )
}

