'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/ToastContainer';

interface User {
  id: string;
  name?: string | null;
  email: string;
  avatar?: string | null;
}

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
  user?: User;
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
  const toast = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
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

  const fetchUserInfo = async (userId: string) => {
    if (users.has(userId)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const userData = await res.json();
        setUsers((prev) => new Map(prev).set(userId, userData));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);

        // Завантажуємо інформацію про користувачів
        if (data && data.length > 0) {
          const userIds = new Set<string>();
          data.forEach((conv: Conversation) => {
            if (conv.user_id) userIds.add(conv.user_id);
          });
          await Promise.all(Array.from(userIds).map(fetchUserInfo));
        }

        if (data && data.length > 0 && !selectedConversationId) {
          setSelectedConversationId(data[0].id);
        }
      } else {
        const errorData = await res.json();
        setConversations([]);
      }
    } catch (error) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data || []);
      } else {
        const errorData = await res.json();
        console.error('Error fetching messages:', errorData);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversationId,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
        await fetchConversations();
        await fetchMessages(selectedConversationId);
        scrollToBottom();
      } else {
        const errorData = await res.json();
        console.error('Error sending message:', errorData);
        toast.error(`Failed to send message: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (res.ok) {
        await fetchConversations();
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null);
        }
        toast.success('Conversation closed successfully');
      } else {
        const errorData = await res.json();
        console.error('Error closing conversation:', errorData);
        toast.error(`Failed to close conversation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error closing conversation:', error);
      toast.error('Failed to close conversation. Please try again.');
    }
  };

  const markAsRead = async () => {
    // Marking as read is handled automatically when fetching messages
    if (selectedConversationId) {
      await fetchMessages(selectedConversationId);
      await fetchConversations();
    }
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
    <div className="flex flex-col min-h-[600px] w-full">
      {/* Header with close button */}
      <div className="px-6 sm:px-8 lg:px-10 py-5 sm:py-6 border-b border-subtle flex items-center justify-between bg-surface-secondary">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground">
            Support Chat
          </h3>
        </div>
        {selectedConversation && selectedConversation.status === 'open' && (
          <button
            onClick={() => closeConversation(selectedConversation.id)}
            className="px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-xl bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-700 whitespace-nowrap">
            Close Conversation
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden min-h-[500px]">
        <div className="w-full sm:w-1/3 lg:w-1/4 border-r border-subtle bg-surface-secondary flex flex-col">
          <div className="p-5 sm:p-6 lg:p-8 border-b border-subtle">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                All Conversations
              </h4>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full">
                {conversations.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm sm:text-base py-12 px-4">
                <p className="mb-2">No conversations yet</p>
                <p className="text-xs sm:text-sm">New conversations will appear here</p>
              </div>
            ) : (
              conversations.map((conv) => {
                return (
                  <button
                    key={conv.id}
                    onClick={async () => {
                      setSelectedConversationId(conv.id);
                      await markAsRead();
                    }}
                    className={`w-full text-left p-5 sm:p-6 lg:p-7 border-b border-subtle last:border-b-0 hover:bg-surface transition ${
                      selectedConversationId === conv.id ? 'bg-surface' : ''
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-base sm:text-lg lg:text-xl flex-shrink-0">
                        {users.get(conv.user_id)?.name?.[0]?.toUpperCase() ||
                          users.get(conv.user_id)?.email?.[0]?.toUpperCase() ||
                          'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-semibold text-foreground text-sm sm:text-base lg:text-lg truncate">
                            {conv.subject || 'Support Request'}
                          </p>
                          {conv.unread && conv.unread > 0 && (
                            <span className="h-6 min-w-[24px] rounded-full bg-primary-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center px-2 flex-shrink-0">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                          {users.get(conv.user_id)?.name ||
                            users.get(conv.user_id)?.email ||
                            `User: ${conv.user_id.substring(0, 8)}...`}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(conv.last_message_at), 'MMM d, yyyy')}
                          </p>
                          <span
                            className={`text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full ${
                              conv.status === 'open'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            {conv.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-7 border-b border-subtle bg-surface-secondary">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-1 truncate">
                      {selectedConversation.subject || 'Support Request'}
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground truncate">
                      {users.get(selectedConversation.user_id)?.name ||
                        users.get(selectedConversation.user_id)?.email ||
                        `User: ${selectedConversation.user_id.substring(0, 8)}...`}
                    </p>
                  </div>
                  <span
                    className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0 ${
                      selectedConversation.status === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                    {selectedConversation.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-5 sm:space-y-6 bg-surface">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <p className="text-base">No messages yet.</p>
                      <p className="text-sm mt-2">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === session?.user.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                        {!isOwn && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
                            {users.get(message.sender_id)?.name?.[0]?.toUpperCase() ||
                              users.get(message.sender_id)?.email?.[0]?.toUpperCase() ||
                              'U'}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-5 sm:px-6 py-3 sm:py-4 ${
                            isOwn
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-surface-secondary text-foreground rounded-bl-none'
                          }`}>
                          {!isOwn && (
                            <p className="text-xs sm:text-sm font-semibold mb-2 opacity-80">
                              {users.get(message.sender_id)?.name || 'User'}
                            </p>
                          )}
                          <p className="text-sm sm:text-base lg:text-lg whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs sm:text-sm mt-2 ${
                              isOwn ? 'text-primary-100' : 'text-muted-foreground'
                            }`}>
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {isOwn && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm sm:text-base font-semibold flex-shrink-0">
                            {session?.user.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-subtle p-6 sm:p-8 lg:p-10 bg-surface-secondary">
                <div className="flex gap-3 sm:gap-4">
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
                    placeholder="Type a message..."
                    disabled={selectedConversation.status === 'closed' || sending}
                    className="flex-1 h-12 sm:h-14 lg:h-16 px-5 sm:px-6 lg:px-8 rounded-xl border border-subtle bg-surface text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={
                      !newMessage.trim() || sending || selectedConversation.status === 'closed'
                    }
                    className="h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-10 rounded-xl bg-primary-600 text-white text-sm sm:text-base lg:text-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap shadow-md">
                    {sending ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
                {selectedConversation.status === 'closed' && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 text-center">
                    This conversation is closed. Reopen it by sending a message.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground bg-surface">
              <div className="text-center">
                <p className="text-base mb-2">Select a conversation to start chatting</p>
                <p className="text-sm">Choose a conversation from the list on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
