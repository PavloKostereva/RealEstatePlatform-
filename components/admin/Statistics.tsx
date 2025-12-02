'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { StatsSkeleton } from '../skeletons/StatsSkeleton'

interface Stats {
  totalListings: number
  totalUsers: number
  pendingListings: number
  listingsThisWeek: number
  usersThisWeek: number
  listingsByDay: Array<{ date: string; count: number }>
  usersByDay: Array<{ date: string; count: number }>
}

export function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <StatsSkeleton />
  }

  if (!stats) {
    return <div className="text-center py-12">Помилка завантаження статистики</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Всього оголошень</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.totalListings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Всього користувачів</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">На модерації</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingListings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-600 text-sm mb-2">Оголошень за тиждень</h3>
          <p className="text-3xl font-bold text-green-600">{stats.listingsThisWeek}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Оголошення за тиждень</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.listingsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#0ea5e9" name="Оголошень" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Користувачі за тиждень</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.usersByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#0ea5e9" name="Користувачів" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}






