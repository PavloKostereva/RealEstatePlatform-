import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';
import { headers } from 'next/headers';

// POST - Додати IBAN (користувач)
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { iban } = body;

    if (!iban || typeof iban !== 'string' || iban.trim().length === 0) {
      return NextResponse.json({ error: 'IBAN is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient(true);

    // Знаходимо правильну назву таблиці
    const tableNames = ['IbanSubmission', 'ibanSubmission', 'iban_submissions', 'IbanSubmissions'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    // Якщо таблиця не існує, створюємо запис в User таблиці (додаємо поле iban)
    if (!actualTableName) {
      // Оновлюємо IBAN в профілі користувача
      const userTableNames = ['User', 'user', 'Users', 'users'];
      let actualUserTableName: string | null = null;

      for (const tableName of userTableNames) {
        const result = await supabase.from(tableName).select('id').limit(1);
        if (!result.error) {
          actualUserTableName = tableName;
          break;
        }
      }

      if (!actualUserTableName) {
        return NextResponse.json({ error: 'Database table not found' }, { status: 500 });
      }

      // Оновлюємо IBAN користувача
      const { data: updatedUser, error: updateError } = await supabase
        .from(actualUserTableName)
        .update({ iban: iban.trim() })
        .eq('id', session.user.id)
        .select('id, email, iban')
        .single();

      if (updateError) {
        console.error('Error updating IBAN:', updateError);
        return NextResponse.json({ error: 'Failed to save IBAN' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'IBAN saved successfully',
        data: updatedUser,
      });
    } else {
      // Якщо таблиця існує, створюємо новий запис
      const { data: submission, error } = await supabase
        .from(actualTableName)
        .insert({
          userId: session.user.id,
          email: session.user.email,
          iban: iban.trim(),
        })
        .select('id, email, iban, createdAt')
        .single();

      if (error) {
        console.error('Error creating IBAN submission:', error);
        return NextResponse.json({ error: 'Failed to save IBAN' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'IBAN saved successfully',
        data: submission,
      });
    }
  } catch (error) {
    console.error('Error saving IBAN:', error);
    return NextResponse.json({ error: 'Failed to save IBAN' }, { status: 500 });
  }
}

// GET - Отримати IBAN submissions (тільки для адміна)
export async function GET() {
  try {
    const headersList = headers();
    const session = await getServerSession({
      ...authOptions,
      req: { headers: Object.fromEntries(headersList.entries()) } as { headers: Record<string, string> },
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient(true);

    // Спробуємо знайти таблицю IBAN submissions
    const tableNames = ['IbanSubmission', 'ibanSubmission', 'iban_submissions', 'IbanSubmissions'];
    let actualTableName: string | null = null;

    for (const tableName of tableNames) {
      const result = await supabase.from(tableName).select('id').limit(1);
      if (!result.error) {
        actualTableName = tableName;
        break;
      }
    }

    if (actualTableName) {
      // Якщо таблиця існує, отримуємо дані з неї
      const { data: submissions, error } = await supabase
        .from(actualTableName)
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching IBAN submissions:', error);
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
      }

      return NextResponse.json(submissions || []);
    } else {
      // Якщо таблиця не існує, отримуємо IBAN з профілів користувачів
      const userTableNames = ['User', 'user', 'Users', 'users'];
      let actualUserTableName: string | null = null;

      for (const tableName of userTableNames) {
        const result = await supabase.from(tableName).select('id').limit(1);
        if (!result.error) {
          actualUserTableName = tableName;
          break;
        }
      }

      if (!actualUserTableName) {
        return NextResponse.json({ error: 'Database table not found' }, { status: 500 });
      }

      const { data: users, error } = await supabase
        .from(actualUserTableName)
        .select('id, email, iban, updatedAt')
        .not('iban', 'is', null);

      if (error) {
        console.error('Error fetching users with IBAN:', error);
        return NextResponse.json({ error: 'Failed to fetch IBAN submissions' }, { status: 500 });
      }

      // Конвертуємо в формат submissions
      const submissions = (users || [])
        .filter((user: { iban?: string | null }) => user.iban)
        .map((user: { id: string; email: string; iban: string; updatedAt?: string | null }) => ({
          id: user.id,
          email: user.email,
          iban: user.iban,
          createdAt: user.updatedAt || new Date().toISOString(),
        }));

      return NextResponse.json(submissions);
    }
  } catch (error) {
    console.error('Error fetching IBAN submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
