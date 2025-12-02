import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;

    if (session.user.id !== resolvedParams.userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient(true);

    // Спробуємо обидва варіанти назви таблиці
    let listings = null;
    let error = null;

    // Спочатку отримуємо listings
    const listingsResult1 = await supabase
      .from('Listing')
      .select(
        `
        *,
        owner:User!Listing_ownerId_fkey (
          id,
          name,
          email,
          avatar
        )
      `,
      )
      .eq('ownerId', resolvedParams.userId)
      .order('createdAt', { ascending: false });

    if (listingsResult1.error && listingsResult1.error.code === '42P01') {
      // Таблиця не існує, спробуємо з малої літери
      const listingsResult2 = await supabase
        .from('listing')
        .select(
          `
          *,
          owner:user!listing_ownerId_fkey (
            id,
            name,
            email,
            avatar
          )
        `,
        )
        .eq('ownerId', resolvedParams.userId)
        .order('createdAt', { ascending: false });
      listings = listingsResult2.data;
      error = listingsResult2.error;
    } else {
      listings = listingsResult1.data;
      error = listingsResult1.error;
    }

    // Якщо не вдалося отримати з join, спробуємо без join
    if (error || !listings) {
      const simpleResult1 = await supabase
        .from('Listing')
        .select('*')
        .eq('ownerId', resolvedParams.userId)
        .order('createdAt', { ascending: false });

      if (simpleResult1.error && simpleResult1.error.code === '42P01') {
        const simpleResult2 = await supabase
          .from('listing')
          .select('*')
          .eq('ownerId', resolvedParams.userId)
          .order('createdAt', { ascending: false });
        listings = simpleResult2.data || [];
        error = simpleResult2.error;
      } else {
        listings = simpleResult1.data || [];
        error = simpleResult1.error;
      }

      // Якщо є listings, отримуємо owner окремо
      interface ListingRow {
        ownerId?: string | null;
        [key: string]: unknown;
      }
      interface OwnerRow {
        id: string;
        name?: string | null;
        email: string;
        avatar?: string | null;
      }
      if (listings && listings.length > 0) {
        const ownerIds = Array.from(
          new Set((listings as ListingRow[]).map((l) => l.ownerId).filter(Boolean) as string[]),
        );
        const ownerResult1 = await supabase
          .from('User')
          .select('id, name, email, avatar')
          .in('id', ownerIds);

        let owners: OwnerRow[] = [];
        if (ownerResult1.error && ownerResult1.error.code === '42P01') {
          const ownerResult2 = await supabase
            .from('user')
            .select('id, name, email, avatar')
            .in('id', ownerIds);
          owners = (ownerResult2.data || []) as OwnerRow[];
        } else {
          owners = (ownerResult1.data || []) as OwnerRow[];
        }

        const ownersMap = new Map(owners.map((o) => [o.id, o]));
        listings = (listings as ListingRow[]).map((listing) => ({
          ...listing,
          owner: listing.ownerId ? ownersMap.get(listing.ownerId) || null : null,
        }));
      }
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user listings:', error);
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }

    return NextResponse.json(listings || []);
  } catch (error) {
    console.error('Error fetching user listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
