import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
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

    const { data: listing, error } = await supabase
      .from(actualTableName)
      .update({ status: 'PUBLISHED' })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error approving listing:', error)
      return NextResponse.json(
        { error: 'Failed to approve listing', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(listing)
  } catch (error: any) {
    console.error('Error approving listing:', error)
    return NextResponse.json(
      { error: 'Failed to approve listing', details: error.message },
      { status: 500 }
    )
  }
}




