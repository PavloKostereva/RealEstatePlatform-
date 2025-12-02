import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

// Отримати всі розмови користувача або адміна
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient(true);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    // Фільтр по статусу
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Якщо користувач не адмін, показуємо тільки його розмови
    if (session.user.role !== 'ADMIN') {
      query = query.or(`user_id.eq.${session.user.id},admin_id.eq.${session.user.id}`);
    }

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations', details: error.message },
        { status: 500 },
      );
    }

    // Отримуємо кількість непрочитаних повідомлень для кожної розмови
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c: any) => c.id);
      const { data: unreadCounts } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', session.user.id);

      const unreadMap = new Map();
      unreadCounts?.forEach((msg: any) => {
        const count = unreadMap.get(msg.conversation_id) || 0;
        unreadMap.set(msg.conversation_id, count + 1);
      });

      const conversationsWithUnread = conversations.map((conv: any) => ({
        ...conv,
        unread: unreadMap.get(conv.id) || 0,
      }));

      return NextResponse.json(conversationsWithUnread);
    }

    return NextResponse.json(conversations || []);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 },
    );
  }
}

// Створити нову розмову
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, adminId } = body;

    const supabase = getSupabaseClient(true);

    let finalAdminId = adminId;
    if (!finalAdminId && session.user.role !== 'ADMIN') {
      const { data: admin } = await supabase
        .from('User')
        .select('id')
        .eq('role', 'ADMIN')
        .limit(1)
        .maybeSingle();

      if (admin) {
        finalAdminId = admin.id;
      } else {
        // Спробуємо з малої літери
        const { data: adminLower } = await supabase
          .from('user')
          .select('id')
          .eq('role', 'ADMIN')
          .limit(1)
          .maybeSingle();

        if (adminLower) {
          finalAdminId = adminLower.id;
        }
      }
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: session.user.id,
        admin_id: finalAdminId || null,
        subject: subject || 'Support Request',
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 },
    );
  }
}
