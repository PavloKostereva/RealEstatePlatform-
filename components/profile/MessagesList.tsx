'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MessagesListProps {
  userId: string
}

export function MessagesList({ userId }: MessagesListProps) {
  const [messages, setMessages] = useState<Array<{
    id: string;
    content: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
    read: boolean;
    [key: string]: unknown;
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMessages()
  }, [userId])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })

      if (res.ok) {
        setMessages(
          messages.map((m) => (m.id === id ? { ...m, read: true } : m))
        )
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Повідомлення</h2>
      {messages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          У вас поки що немає повідомлень
        </p>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition ${
                !message.read ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => markAsRead(message.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{message.subject}</h3>
                  <p className="text-sm text-gray-600">
                    Від: {message.sender.name || message.sender.email}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">
                    {new Date(message.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                  {!message.read && (
                    <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                  )}
                </div>
              </div>
              <p className="text-gray-700 line-clamp-2">{message.content}</p>
              {message.listing && (
                <Link
                  href={`/listings/${message.listing.id}`}
                  className="text-primary-600 text-sm hover:underline mt-2 inline-block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Переглянути оголошення →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}






