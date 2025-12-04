import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { headers } from 'next/headers';

/**
 * GET /api/users/[id]/credits - Отримати кредити користувача
 * PUT /api/users/[id]/credits - Оновити кредити користувача (тільки для адмінів)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;

    // Користувач може переглядати тільки свої кредити, адмін - будь-які
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Спробуємо отримати користувача з полем credits
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, name, credits')
      .eq('id', userId)
      .single();

    if (error) {
      // Якщо помилка через неіснуючу колонку credits, повертаємо 0
      const errorMessage = error.message || '';
      if (error.code === '42703' || (errorMessage.includes('column') && errorMessage.includes('credits'))) {
        return NextResponse.json({ credits: 0, message: 'Credits field not found in database' });
      }
      console.error('Error fetching user credits:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      credits: user.credits || 0,
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Error in GET /api/users/[id]/credits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Тільки адміни можуть оновлювати кредити
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const userId = resolvedParams.id;
    const { credits, action } = await request.json(); // action: 'set' | 'add' | 'subtract'

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({ error: 'Invalid credits value' }, { status: 400 });
    }

    const supabase = getSupabaseClient(true); // Використовуємо service_role для оновлення

    // Спочатку отримаємо поточні кредити
    const { data: currentUser, error: fetchError } = await supabase
      .from('User')
      .select('id, email, name, credits')
      .eq('id', userId)
      .single();

    if (fetchError) {
      // Якщо колонка credits не існує, спробуємо створити її через SQL або просто встановити значення
      if (fetchError.code === '42703' || fetchError.message?.includes('column')?.includes('credits')) {
        console.log('Credits column does not exist, attempting to add credits field...');
        // Спробуємо оновити без credits, а потім додамо через SQL
        // Або просто повернемо помилку з інструкцією
        return NextResponse.json(
          {
            error: 'Credits column does not exist in User table',
            message: 'Please add a "credits" column (numeric) to the User table in Supabase',
          },
          { status: 400 },
        );
      }
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    let newCredits: number;
    const currentCredits = currentUser.credits || 0;

    switch (action) {
      case 'add':
        newCredits = currentCredits + credits;
        break;
      case 'subtract':
        newCredits = Math.max(0, currentCredits - credits);
        break;
      case 'set':
      default:
        newCredits = credits;
        break;
    }

    // Оновлюємо кредити
    const { data: updatedUser, error: updateError } = await supabase
      .from('User')
      .update({ credits: newCredits })
      .eq('id', userId)
      .select('id, email, name, credits')
      .single();

    if (updateError) {
      // Якщо помилка через неіснуючу колонку
      if (updateError.code === '42703' || updateError.message?.includes('column')?.includes('credits')) {
        return NextResponse.json(
          {
            error: 'Credits column does not exist in User table',
            message: 'Please add a "credits" column (numeric) to the User table in Supabase',
            sql: 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS credits NUMERIC DEFAULT 0;',
          },
          { status: 400 },
        );
      }
      console.error('Error updating user credits:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      previousCredits: currentCredits,
      newCredits: updatedUser.credits || 0,
      action: action || 'set',
    });
  } catch (error) {
    console.error('Error in PUT /api/users/[id]/credits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

