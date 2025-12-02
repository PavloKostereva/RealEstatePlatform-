import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const supabase = getSupabaseClient(true)

    // Спробуємо обидва варіанти назви таблиці
    let user = null
    let error = null

    const result1 = await supabase
      .from('User')
      .select('id, email, name, phone, avatar, role, ownerVerified, createdAt, updatedAt')
      .eq('id', resolvedParams.id)
      .maybeSingle()

    if (result1.error && result1.error.code === '42P01') {
      // Таблиця не існує, спробуємо з малої літери
      const result2 = await supabase
        .from('user')
        .select('id, email, name, phone, avatar, role, ownerVerified, createdAt, updatedAt')
        .eq('id', resolvedParams.id)
        .maybeSingle()
      user = result2.data
      error = result2.error
    } else {
      user = result1.data
      error = result1.error
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}




