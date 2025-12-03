'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TableRowsSkeleton } from '../skeletons/TableRowsSkeleton'

interface User {
  id: string
  email: string
  name?: string
  phone?: string
  avatar?: string
  role: string
  ownerVerified: boolean
  createdAt: string
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlock = async (id: string) => {
    // Implement block functionality
    console.log('Block user:', id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цього користувача?')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id))
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Користувачі</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Користувач</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Роль</th>
              <th className="text-left py-3 px-4">Дата реєстрації</th>
              <th className="text-left py-3 px-4">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRowsSkeleton rows={5} columns={5} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  Користувачів не знайдено
                </td>
              </tr>
            ) : (
              users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image
                          src={user.avatar}
                          alt={user.name || 'User'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{user.name || 'Користувач'}</p>
                      {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                    {user.role === 'ADMIN'
                      ? 'Адмін'
                      : user.role === 'OWNER'
                      ? 'Власник'
                      : 'Користувач'}
                  </span>
                  {user.ownerVerified && (
                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                      Verified
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBlock(user.id)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition"
                    >
                      Заблокувати
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    >
                      Видалити
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}






