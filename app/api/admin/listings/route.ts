import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const requestHeaders = new Headers(request.headers);
    const cookieHeader = requestHeaders.get('cookie') || '';
    const req = {
      headers: Object.fromEntries(requestHeaders.entries()),
    } as { headers: Record<string, string> };

    const session = await getServerSession({
      ...authOptions,
      req,
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No session found' },
        { status: 401 },
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          details: `User role is ${session.user.role}, expected ADMIN`,
        },
        { status: 401 },
      );
    }

    const supabase = getSupabaseClient(true);

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
      return NextResponse.json({ error: 'Database table not found' }, { status: 503 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase.from(actualTableName).select('*');

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.order('createdAt', { ascending: false });

    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings', details: error.message },
        { status: 500 },
      );
    }

    const ownerIds = Array.from(
      new Set((listings || []).map((l: { ownerId?: string }) => l.ownerId).filter(Boolean)),
    );
    const ownerMap = new Map<string, { id: string; name?: string | null; email?: string | null }>();

    if (ownerIds.length > 0) {
      const userTableNames = ['User', 'user', 'Users', 'users'];
      let actualUserTableName: string | null = null;

      for (const tableName of userTableNames) {
        const result = await supabase.from(tableName).select('id').limit(1);
        if (!result.error) {
          actualUserTableName = tableName;
          break;
        }
      }

      if (actualUserTableName) {
        const { data: owners } = await supabase
          .from(actualUserTableName)
          .select('id, name, email')
          .in('id', ownerIds);

        if (owners) {
          owners.forEach((owner: { id: string; name?: string | null; email?: string | null }) => {
            ownerMap.set(owner.id, owner);
          });
        }
      }
    }

    // Маппінг даних
    const mappedListings = (listings || []).map(
      (listing: { ownerId?: string; [key: string]: unknown }) => ({
        ...listing,
        owner: (listing.ownerId ? ownerMap.get(listing.ownerId) : undefined) || {
          id: listing.ownerId || '',
          name: null,
          email: null,
        },
      }),
    );

    return NextResponse.json(mappedListings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: errorMessage },
      { status: 500 },
    );
  }
}
