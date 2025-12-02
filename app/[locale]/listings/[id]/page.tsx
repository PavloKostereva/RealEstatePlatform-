import { ListingDetails } from '@/components/listings/ListingDetails';
import { notFound } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

async function getListing(id: string) {
  try {
    const supabase = getSupabaseClient(true);

    // Знаходимо правильну назву таблиці
    const tableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (!actualTableName) {
      return null;
    }

    // Отримуємо listing
    const { data: listing, error } = await supabase
      .from(actualTableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !listing) {
      return null;
    }

    // Отримуємо дані owner
    const userTableNames = ['User', 'user', 'Users', 'users'];
    let actualUserTableName: string | null = null;

    for (const tableName of userTableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualUserTableName = tableName;
        break;
      }
    }

    let owner = null;
    if (actualUserTableName && listing.ownerId) {
      const { data: ownerData } = await supabase
        .from(actualUserTableName)
        .select('id, name, email, phone, avatar')
        .eq('id', listing.ownerId)
        .single();
      owner = ownerData;
    }

    // Отримуємо reviews (якщо є таблиця Review)
    let reviews: any[] = [];
    const reviewTableNames = ['Review', 'review', 'Reviews', 'reviews'];
    let actualReviewTableName: string | null = null;

    for (const tableName of reviewTableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualReviewTableName = tableName;
        break;
      }
    }

    if (actualReviewTableName) {
      const { data: reviewsData } = await supabase
        .from(actualReviewTableName)
        .select('*, user:User!userId(id, name, avatar)')
        .eq('listingId', id)
        .order('createdAt', { ascending: false });

      if (reviewsData) {
        reviews = reviewsData.map((review: any) => ({
          ...review,
          user: review.user || {
            id: review.userId,
            name: null,
            avatar: null,
          },
        }));
      }
    }

    // Increment views
    await supabase
      .from(actualTableName)
      .update({ views: (listing.views || 0) + 1 })
      .eq('id', id);

    return {
      ...listing,
      owner: owner || {
        id: listing.ownerId,
        name: null,
        email: null,
        phone: null,
        avatar: null,
      },
      reviews,
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return null;
  }
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ListingDetails listing={listing} />
    </div>
  );
}
