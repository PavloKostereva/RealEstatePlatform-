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

export function AdminSupportChat() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      const interval = setInterval(() => {
        fetchMessages(selectedConversationId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        if (data.length > 0 && !selectedConversationId) {
          setSelectedConversationId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
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
    if (!newMessage.trim() || !selectedConversationId || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages([...messages, message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (res.ok) {
        fetchConversations();
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
        }
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const markAsRead = async () => {
    // Marking as read is handled automatically when fetching messages
    fetchConversations();
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header with close button */}
      <div className="px-6 py-4 border-b border-subtle flex items-center justify-between bg-surface-secondary">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Support Chat</h3>
        </div>
        {selectedConversation && selectedConversation.status === 'open' && (
          <button
            onClick={() => closeConversation(selectedConversation.id)}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700">
            Close Conversation
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden min-h-[500px]">
        {/* Список розмов */}
        <div className="w-1/3 border-r border-subtle bg-surface-secondary flex flex-col">
          <div className="p-4 border-b border-subtle">
            <h4 className="text-sm font-semibold text-foreground">All Conversations</h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 px-4">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => {
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      markAsRead(conv.id);
                    }}
                    className={`w-full text-left p-4 border-b border-subtle last:border-b-0 hover:bg-surface transition ${
                      selectedConversationId === conv.id ? 'bg-surface' : ''
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm truncate">
                            {conv.subject || 'Support Request'}
                          </p>
                          {conv.unread && conv.unread > 0 && (
                            <span className="ml-2 h-5 min-w-[20px] rounded-full bg-primary-600 text-white text-xs flex items-center justify-center px-1.5">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          User: {conv.user_id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(conv.last_message_at), 'MMM d, yyyy')}
                        </p>
                        <span
                          className={`text-xs font-medium mt-1 ${
                            conv.status === 'open' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                          {conv.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Область повідомлень */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No messages yet. Start the conversation!</p>
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
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="h-11 w-11 rounded-xl bg-surface-secondary border border-subtle text-foreground hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
