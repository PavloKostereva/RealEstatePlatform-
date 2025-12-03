import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const headersList = headers()
    const resolvedParams = params instanceof Promise ? await params : params
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as any,
    })
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient(true)

    // Знаходимо правильну назву таблиці
    const tableNames = ['Listing', 'listings', 'Listings', 'listing']
    let actualTableName: string | null = null

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1)
      if (!result.error) {
        actualTableName = tableName
        break
      }
    }

    if (!actualTableName) {
      return NextResponse.json(
        { error: 'Database table not found' },
        { status: 503 }
      )
    }

    // Використовуємо ARCHIVED для відхилених listings
    // (або можна додати REJECTED в enum, але ARCHIVED теж підходить)
    const { data: listing, error } = await supabase
      .from(actualTableName)
      .update({ status: 'ARCHIVED' })
      .eq('id', resolvedParams.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error rejecting listing:', error)
      return NextResponse.json(
        { error: 'Failed to reject listing', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(listing)
  } catch (error: any) {
    console.error('Error rejecting listing:', error)
    return NextResponse.json(
      { error: 'Failed to reject listing', details: error.message },
      { status: 500 }
    )
  }
}

