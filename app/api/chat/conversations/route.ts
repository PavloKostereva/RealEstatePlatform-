import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

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

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

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

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c: { id: string }) => c.id);
      const { data: unreadCounts } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', session.user.id);

      const unreadMap = new Map<string, number>();
      unreadCounts?.forEach((msg: { conversation_id: string }) => {
        const count = unreadMap.get(msg.conversation_id) || 0;
        unreadMap.set(msg.conversation_id, count + 1);
      });

      const lastMessagesMap = new Map<string, { content: string; created_at: string }>();
      for (const convId of conversationIds) {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMessage) {
          lastMessagesMap.set(convId, lastMessage);
        }
      }

      const conversationsWithUnread = conversations.map(
        (conv: { id: string; [key: string]: unknown }) => ({
          ...conv,
          unread: unreadMap.get(conv.id) || 0,
          lastMessage: lastMessagesMap.get(conv.id)?.content || '',
          lastMessageDate: lastMessagesMap.get(conv.id)?.created_at || conv.last_message_at,
        }),
      );

      return NextResponse.json(conversationsWithUnread);
    }

    return NextResponse.json(conversations || []);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, adminId, userId } = body;

    const supabase = getSupabaseClient(true);

    let finalAdminId = adminId;
    if (!finalAdminId && session.user.role !== 'ADMIN') {
      const { prisma } = await import('@/lib/prisma');
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (admin) {
        finalAdminId = admin.id;
      }
    }

    const finalUserId = userId || session.user.id;
    const finalAdminIdValue =
      session.user.role === 'ADMIN' ? session.user.id : finalAdminId || null;

    // Перевіряємо, чи вже існує розмова з цим користувачем
    if (finalAdminIdValue && finalUserId) {
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', finalUserId)
        .eq('admin_id', finalAdminIdValue)
        .maybeSingle();

      if (existingConversation) {
        // Повертаємо існуючу розмову замість створення нової
        return NextResponse.json(existingConversation, { status: 200 });
      }
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: finalUserId,
        admin_id: finalAdminIdValue,
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
  } catch (error) {
    console.error('Error creating conversation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create conversation', details: errorMessage },
      { status: 500 },
    );
  }
}
