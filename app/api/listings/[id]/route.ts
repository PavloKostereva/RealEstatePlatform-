import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        { status: 500 }
      )
    }

    // Отримуємо лістинг
    const { data: listing, error: fetchError } = await supabase
      .from(actualTableName)
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Increment views
    await supabase
      .from(actualTableName)
      .update({ views: (listing.views || 0) + 1 })
      .eq('id', params.id)

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
        { status: 500 }
      )
    }

    // Отримуємо лістинг для перевірки прав
    const { data: listing, error: fetchError } = await supabase
      .from(actualTableName)
      .select('ownerId')
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Валідація та підготовка даних для оновлення
    const updateData: Record<string, unknown> = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.price !== undefined) updateData.price = parseFloat(body.price)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.address !== undefined) updateData.address = body.address
    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude !== null ? parseFloat(body.latitude) : null
    }
    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude !== null ? parseFloat(body.longitude) : null
    }
    if (body.area !== undefined) {
      updateData.area = body.area !== null ? parseFloat(body.area) : null
    }
    if (body.rooms !== undefined) {
      updateData.rooms = body.rooms !== null ? parseInt(body.rooms) : null
    }
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : []
    if (body.amenities !== undefined) updateData.amenities = Array.isArray(body.amenities) ? body.amenities : []
    if (body.availableFrom !== undefined) {
      updateData.availableFrom = body.availableFrom ? new Date(body.availableFrom).toISOString() : null
    }
    if (body.availableTo !== undefined) {
      updateData.availableTo = body.availableTo ? new Date(body.availableTo).toISOString() : null
    }
    if (body.status !== undefined) updateData.status = body.status

    // Оновлюємо лістинг через Supabase
    const { data: updated, error: updateError } = await supabase
      .from(actualTableName)
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating listing:', updateError)
      return NextResponse.json(
        { error: 'Failed to update listing', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating listing:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to update listing', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
        { status: 500 }
      )
    }

    // Отримуємо лістинг для перевірки прав
    const { data: listing, error: fetchError } = await supabase
      .from(actualTableName)
      .select('ownerId')
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Видаляємо лістинг
    const { error: deleteError } = await supabase
      .from(actualTableName)
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting listing:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}






