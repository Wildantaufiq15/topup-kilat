'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  RefreshCw,
  Shield,
  UserX,
  UserCheck,
  Eye,
  MoreVertical,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: 'USER' | 'CS' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN'
  member_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  points_balance: number
  is_verified: boolean
  is_active: boolean
  last_login_at: string | null
  created_at: string
  orders_count?: number
}

type RoleFilter = 'ALL' | 'USER' | 'CS' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Fetch users via API
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (!result.success) throw new Error(result.message)

      // Get orders count for each user via API
      const ordersResponse = await fetch('/api/admin/orders')
      const ordersResult = await ordersResponse.json()
      const orders = ordersResult.data || []

      // Count orders per user
      const orderCounts: Record<string, number> = {}
      orders.forEach((order: any) => {
        if (order.user_id) {
          orderCounts[order.user_id] = (orderCounts[order.user_id] || 0) + 1
        }
      })

      // Map orders count to users
      const usersWithCounts = (result.data || []).map((user: any) => ({
        ...user,
        orders_count: orderCounts[user.id] || 0,
      }))

      setUsers(usersWithCounts)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          is_active: !user.is_active,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      toast.success(`User ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchUsers()
    } catch (error) {
      console.error('Error toggling user:', error)
      toast.error('Gagal update status')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          role: newRole,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      toast.success('Role berhasil diupdate')
      setShowEditModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Gagal update role')
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search)

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: User['role']) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      USER: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'User' },
      CS: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'CS' },
      FINANCE: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Finance' },
      ADMIN: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Admin' },
      SUPER_ADMIN: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Super Admin' },
    }
    const style = styles[role] || styles.USER
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const getMemberBadge = (tier: User['member_tier']) => {
    const colors: Record<string, string> = {
      BRONZE: 'text-amber-600',
      SILVER: 'text-gray-400',
      GOLD: 'text-yellow-500',
      PLATINUM: 'text-slate-300',
    }
    return (
      <span className={`text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Users</h1>
          <p className="text-white/60 text-sm mt-1">
            {filteredUsers.length} user ditemukan
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={fetchUsers}
          isLoading={isLoading}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Cari email, nama, atau telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {(['ALL', 'USER', 'CS', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'] as RoleFilter[]).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-2 text-sm rounded-lg whitespace-nowrap transition-all ${
                roleFilter === role
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-surface-primary border border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {role === 'ALL' ? 'Semua' : role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">User</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Role</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Member</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Orders</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Terdaftar</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/50">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/50">
                    User tidak ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white font-medium">
                          {user.name || '-'}
                        </p>
                        <p className="text-xs text-white/50">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-white/50">{user.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-3">
                      {getMemberBadge(user.member_tier)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">
                        {user.orders_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                          <UserCheck size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                          <UserX size={12} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white/70">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditModal(true)
                          }}
                          className="p-2 text-white/50 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                          title="Edit Role"
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 rounded-lg transition-all ${
                            user.is_active
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                          title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-md">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Role User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-white/50">User</p>
                <p className="text-white font-medium">
                  {selectedUser.name || selectedUser.email}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-white/50 mb-2">Pilih Role</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['USER', 'CS', 'FINANCE', 'ADMIN', 'SUPER_ADMIN'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(selectedUser.id, role)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedUser.role === role
                          ? 'bg-primary-500/20 text-primary-400 border-primary-500/50'
                          : 'bg-dark-100 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/5">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                }}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
