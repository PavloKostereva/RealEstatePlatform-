import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

// Оновити розмову (наприклад, закрити)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const supabase = getSupabaseClient(true);

    // Перевіряємо, чи користувач має доступ до цієї розмови
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Тільки адміни можуть змінювати статус
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Оновлюємо розмову
    const { data: updated, error } = await supabase
      .from('conversations')
      .update({ status: status || conversation.status })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to update conversation', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation', details: error.message },
      { status: 500 }
    );
  }
}

