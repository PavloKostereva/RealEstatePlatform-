import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as {
        headers: Record<string, string>;
      },
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session.user.id;

    // Security: Users can only access their own saved listings unless they are ADMIN
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient(true);

    // Знаходимо правильну назву таблиці
    const tableNames = ['SavedListing', 'savedListing', 'saved_listings', 'SavedListings'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (!actualTableName) {
      return NextResponse.json([]);
    }

    // Отримуємо saved listings
    const { data: savedListings, error } = await supabase
      .from(actualTableName)
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching saved listings:', error);
      return NextResponse.json({ error: 'Failed to fetch saved listings' }, { status: 500 });
    }

    if (!savedListings || savedListings.length === 0) {
      return NextResponse.json([]);
    }

    // Отримуємо listings для кожного saved listing
    const listingTableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualListingTableName: string | null = null;

    for (const tableName of listingTableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualListingTableName = tableName;
        break;
      }
    }

    const listingIds = savedListings.map((sl: { listingId: string }) => sl.listingId);

    if (actualListingTableName && listingIds.length > 0) {
      const { data: listings } = await supabase
        .from(actualListingTableName)
        .select('*')
        .in('id', listingIds);

      // Отримуємо owners для listings
      const userTableNames = ['User', 'user', 'Users', 'users'];
      let actualUserTableName: string | null = null;

      for (const tableName of userTableNames) {
        const result = await supabase.from(tableName).select('id').limit(1);
        if (!result.error) {
          actualUserTableName = tableName;
          break;
        }
      }

      if (actualUserTableName && listings) {
        const ownerIds = Array.from(
          new Set(listings.map((l: { ownerId?: string }) => l.ownerId).filter(Boolean) as string[]),
        );
        const { data: owners } = await supabase
          .from(actualUserTableName)
          .select('id, name, email, avatar')
          .in('id', ownerIds);

        // Об'єднуємо дані
        const listingsWithOwners = listings.map(
          (listing: { ownerId?: string; id: string; [key: string]: unknown }) => ({
            ...listing,
            owner: owners?.find((o: { id: string }) => o.id === listing.ownerId) || null,
          }),
        );

        const result = savedListings.map(
          (saved: { listingId: string; [key: string]: unknown }) => ({
            ...saved,
            listing:
              listingsWithOwners.find((l: { id: string }) => l.id === saved.listingId) || null,
          }),
        );

        return NextResponse.json(result);
      }
    }

    return NextResponse.json(
      savedListings.map((saved: { [key: string]: unknown }) => ({
        ...saved,
        listing: null,
      })),
    );
  } catch (error) {
    console.error('Error fetching saved listings:', error);
    return NextResponse.json({ error: 'Failed to fetch saved listings' }, { status: 500 });
  }
}
