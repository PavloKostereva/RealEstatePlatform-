import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditListingForm } from '@/components/listings/EditListingForm'
import { prisma } from '@/lib/prisma'

async function getListing(id: string, userId: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!listing) {
      return null
    }

    // Check if user is owner or admin
    const session = await getServerSession(authOptions)
    if (!session || (listing.ownerId !== userId && session.user.role !== 'ADMIN')) {
      return null
    }

    return listing
  } catch (error) {
    console.error('Error fetching listing:', error)
    return null
  }
}

export default async function EditListingPage({
  params,
}: {
  params: { id: string; locale: string }
}) {
  const session = await getServerSession(authOptions)
  const locale = params.locale

  if (!session) {
    redirect(`/${locale}/how-it-works`)
  }

  const listing = await getListing(params.id, session.user.id)

  if (!listing) {
    redirect(`/${locale}/listings`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EditListingForm listing={listing} />
    </div>
  )
}

