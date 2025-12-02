'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface ContactFormProps {
  listingId: string
  ownerId: string
}

export function ContactForm({ listingId, ownerId }: ContactFormProps) {
  const { data: session } = useSession()
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setLoading(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: ownerId,
          listingId,
          subject,
          content,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setSubject('')
        setContent('')
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тема</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Питання про оголошення"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Повідомлення</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Ваше повідомлення..."
        />
      </div>
      {success && (
        <p className="text-green-600 text-sm">Повідомлення надіслано!</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
      >
        {loading ? 'Відправка...' : 'Надіслати повідомлення'}
      </button>
    </form>
  )
}






