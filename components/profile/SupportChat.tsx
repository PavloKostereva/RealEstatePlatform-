'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';

interface Conversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  subject: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface SupportChatProps {
  onClose?: () => void;
}

interface AdminUser {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
  role?: string;
}

export function SupportChat({ onClose }: SupportChatProps) {
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (session?.user) {
      fetchOrCreateConversation();
    }
  }, [session]);

  // Real-time subscription для messages
  useEffect(() => {
    if (!conversation) return;

    // Спочатку завантажуємо повідомлення
    shouldScrollRef.current = true; // Прокручуємо при відкритті розмови
    fetchMessages(conversation.id);

    // Налаштовуємо real-time підписку для повідомлень (якщо Supabase налаштований)
    const supabase = createClient();
    let messagesChannel: { unsubscribe: () => void } | null = null;

    if (supabase) {
      try {
        messagesChannel = supabase
          .channel(`messages-${conversation.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversation.id}`,
            },
            (payload) => {
              console.log('Message change:', payload);

              if (payload.eventType === 'INSERT') {
                // Додаємо нове повідомлення
                const newMessage = payload.new as Message;
                setMessages((prev) => {
                  // Перевіряємо, чи повідомлення вже є (щоб уникнути дублікатів)
                  if (prev.some((m) => m.id === newMessage.id)) {
                    return prev;
                  }
                  shouldScrollRef.current = true; // Прокручуємо при отриманні нового повідомлення
                  return [...prev, newMessage];
                });
                // Оновлюємо розмову для оновлення last_message_at
                fetchOrCreateConversation();
              } else if (payload.eventType === 'UPDATE') {
                // Оновлюємо існуюче повідомлення (наприклад, статус read)
                const updatedMessage = payload.new as Message;
                setMessages((prev) =>
                  prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)),
                );
              }
            },
          )
          .subscribe();
      } catch (error) {
        console.warn('Failed to subscribe to messages changes:', error);
      }
    }

    // Polling (частіше, якщо real-time не працює)
    const pollInterval = supabase ? 30000 : 3000; // 30 сек якщо є real-time, 3 сек якщо ні
    const interval = setInterval(() => {
      fetchMessages(conversation.id);
    }, pollInterval);

    return () => {
      if (messagesChannel) {
        messagesChannel.unsubscribe();
      }
      clearInterval(interval);
    };
  }, [conversation]);

  useEffect(() => {
    // Прокручуємо тільки якщо:
    // 1. shouldScrollRef.current === true (встановлено при відкритті розмови, надсиланні або отриманні повідомлення)
    // 2. Або кількість повідомлень збільшилася (нове повідомлення)
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;

    if (shouldScrollRef.current || hasNewMessages) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }

    lastMessageCountRef.current = currentMessageCount;
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchAdminInfo = async (adminId: string) => {
    if (!adminId) return;
    try {
      const res = await fetch(`/api/users/${adminId}`);
      if (res.ok) {
        const adminData = await res.json();
        setAdminUser(adminData);
      }
    } catch (error) {
      console.error('Error fetching admin info:', error);
    }
  };

  const fetchOrCreateConversation = async () => {
    try {
      // Спочатку намагаємося знайти існуючу розмову
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          // Використовуємо першу розмову (має бути тільки одна)
          const conv = data[0];
          setConversation(conv);
          // Завантажуємо інформацію про адміна, якщо він є
          if (conv.admin_id) {
            await fetchAdminInfo(conv.admin_id);
          }
        } else {
          // Якщо розмови немає, створюємо нову
          await createConversation();
        }
      }
    } catch {
      await createConversation();
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!session?.user) return;

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Support Request',
        }),
      });

      if (res.ok) {
        const newConversation = await res.json();
        setConversation(newConversation);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const message = await res.json();
        shouldScrollRef.current = true; // Прокручуємо після надсилання повідомлення
        setMessages([...messages, message]);
        setNewMessage('');
        // Оновлюємо розмову для оновлення last_message_at
        fetchOrCreateConversation();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-subtle bg-surface shadow-md overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-surface-secondary px-6 py-4 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">Support Chat</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-foreground hover:text-primary-600 transition">
            Close
          </button>
        )}
      </div>

      {/* Область повідомлень */}
      <div className="flex-1 flex flex-col">
        {conversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  // Визначаємо, чи повідомлення від адміна чи від користувача
                  const isFromAdmin = conversation?.admin_id
                    ? message.sender_id === conversation.admin_id
                    : false;
                  const isOwn = message.sender_id === session?.user.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        isOwn ? 'justify-end' : 'justify-start'
                      } animate-in fade-in ${
                        isOwn ? 'slide-in-from-right' : 'slide-in-from-left'
                      } duration-300`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {isFromAdmin
                            ? adminUser?.name?.[0]?.toUpperCase() || 'A'
                            : session?.user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-xl px-3 py-2 transition-all duration-200 hover:scale-[1.02] ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-none shadow-md hover:shadow-lg hover:shadow-primary-600/30'
                            : isFromAdmin
                            ? 'bg-emerald-600 text-white rounded-bl-none shadow-md hover:shadow-lg hover:shadow-emerald-600/30'
                            : 'bg-surface-secondary text-foreground rounded-bl-none shadow-sm hover:shadow-md'
                        }`}>
                        {!isOwn && isFromAdmin && (
                          <p className="text-xs font-semibold mb-1 opacity-80">
                            {adminUser?.name || 'Admin'}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isOwn
                              ? 'text-primary-100'
                              : isFromAdmin
                              ? 'text-emerald-100'
                              : 'text-muted-foreground'
                          }`}>
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {session?.user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-subtle p-4 bg-surface-secondary">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  className="flex-1 h-11 px-4 rounded-xl border border-subtle bg-surface text-foreground placeholder:text-muted-foreground"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition">
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p>Loading conversation...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
