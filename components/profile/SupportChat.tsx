'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

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

export function SupportChat({ onClose }: SupportChatProps) {
  const { data: session } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetchOrCreateConversation();
    }
  }, [session]);

  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id);
      const interval = setInterval(() => {
        fetchMessages(conversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOrCreateConversation = async () => {
    try {
      // Спочатку намагаємося знайти існуючу розмову
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          // Використовуємо першу розмову (має бути тільки одна)
          setConversation(data[0]);
        } else {
          // Якщо розмови немає, створюємо нову
          await createConversation();
        }
      }
    } catch (error) {
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
                  const isOwn = message.sender_id === session?.user.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-none'
                            : 'bg-surface-secondary text-foreground rounded-bl-none'
                        }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-100' : 'text-muted-foreground'
                          }`}>
                          {format(new Date(message.created_at), 'h:mm:ss a')}
                        </p>
                      </div>
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
