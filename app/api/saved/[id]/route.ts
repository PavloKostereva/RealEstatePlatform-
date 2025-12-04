import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });
    if (!session) {
      return NextResponse.json({ saved: false });
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
      // Якщо таблиця не знайдена, повертаємо false
      return NextResponse.json({ saved: false });
    }

    const { data, error } = await supabase
      .from(actualTableName)
      .select('id')
      .eq('userId', session.user.id)
      .eq('listingId', resolvedParams.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking saved:', error);
      return NextResponse.json({ saved: false });
    }

    return NextResponse.json({ saved: !!data });
  } catch (error) {
    console.error('Error checking saved:', error);
    return NextResponse.json({ saved: false });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json(
        { error: 'SavedListing table not found in database' },
        { status: 500 },
      );
    }

    // Перевіряємо, чи вже збережено
    const { data: existing } = await supabase
      .from(actualTableName)
      .select('*')
      .eq('userId', session.user.id)
      .eq('listingId', resolvedParams.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Перевіряємо, чи існує listing в Supabase
    const listingTableNames = ['Listing', 'listings', 'Listings', 'listing'];
    let actualListingTableName: string | null = null;

    for (const tableName of listingTableNames) {
      const result = await supabase
        .from(tableName)
        .select('id')
        .eq('id', resolvedParams.id)
        .limit(1);
      if (!result.error && result.data && result.data.length > 0) {
        actualListingTableName = tableName;
        break;
      }
    }

    if (!actualListingTableName) {
      return NextResponse.json(
        {
          error: 'Listing not found',
          message: 'The listing you are trying to save does not exist in the database.',
        },
        { status: 404 },
      );
    }

    // Створюємо SavedListing
    const { data: saved, error: insertError } = await supabase
      .from(actualTableName)
      .insert({
        userId: session.user.id,
        listingId: resolvedParams.id,
      })
      .select()
      .single();

    if (insertError) {
      // Якщо помилка через дублікат (unique constraint)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        // Перевіряємо ще раз
        const { data: existingCheck } = await supabase
          .from(actualTableName)
          .select('*')
          .eq('userId', session.user.id)
          .eq('listingId', resolvedParams.id)
          .maybeSingle();

        if (existingCheck) {
          return NextResponse.json(existingCheck);
        }
      }

      console.error('Error saving listing:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to save listing',
          message: insertError.message || 'An unexpected error occurred',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      {
        error: 'Failed to save listing',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const resolvedParams = params instanceof Promise ? await params : params;
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      // Якщо таблиця не знайдена, вважаємо що видалення успішне
      return NextResponse.json({ success: true });
    }

    const { error: deleteError } = await supabase
      .from(actualTableName)
      .delete()
      .eq('userId', session.user.id)
      .eq('listingId', resolvedParams.id);

    if (deleteError) {
      // Якщо запис не знайдено, це не помилка
      if (deleteError.code === 'PGRST116' || deleteError.message?.includes('not found')) {
        return NextResponse.json({ success: true });
      }
      console.error('Error unsaving listing:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unsave listing', message: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving listing:', error);
    // Якщо запис не знайдено, це не помилка
    return NextResponse.json({ success: true });
  }
}
