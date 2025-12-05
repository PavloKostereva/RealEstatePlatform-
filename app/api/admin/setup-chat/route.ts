import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

// Endpoint для створення таблиць чату в Supabase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient(true);

    // SQL скрипт для створення таблиць
    const createTablesSQL = `
      -- Створення таблиці для розмов (conversations)
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        admin_id UUID,
        subject TEXT,
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Створення таблиці для повідомлень (messages)
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Індекси для швидкого пошуку
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    `;

    // Виконуємо SQL через RPC або напряму
    // Supabase не підтримує прямі SQL запити через JS client
    // Тому використовуємо альтернативний підхід - перевіряємо і створюємо таблиці через API
    
    // Спробуємо створити таблиці через прямі запити
    const tables = [
      {
        name: 'conversations',
        create: async () => {
          // Перевіряємо, чи існує таблиця
          const { error: checkError } = await supabase
            .from('conversations')
            .select('id')
            .limit(1);

          if (checkError && checkError.message.includes('does not exist')) {
            // Таблиця не існує, потрібно створити через SQL Editor в Supabase
            return { needsManualSetup: true };
          }
          return { exists: true };
        },
      },
      {
        name: 'messages',
        create: async () => {
          const { error: checkError } = await supabase
            .from('messages')
            .select('id')
            .limit(1);

          if (checkError && checkError.message.includes('does not exist')) {
            return { needsManualSetup: true };
          }
          return { exists: true };
        },
      },
    ];

    const results = await Promise.all(tables.map((t) => t.create()));

    const needsSetup = results.some((r) => r.needsManualSetup);

    if (needsSetup) {
      return NextResponse.json({
        error: 'Tables need to be created manually',
        message:
          'Please run the SQL script from supabase-chat-schema.sql in your Supabase SQL Editor',
        sqlScript: createTablesSQL,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Chat tables are ready',
    });
  } catch (error) {
    console.error('Error setting up chat tables:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to setup chat tables',
        details: errorMessage,
        message:
          'Please run the SQL script from supabase-chat-schema.sql in your Supabase SQL Editor',
      },
      { status: 500 },
    );
  }
}

