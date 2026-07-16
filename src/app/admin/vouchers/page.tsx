'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Copy,
  Ticket,
  Percent,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

interface Voucher {
  id: string
  code: string
  name: string | null
  description: string | null
  type: 'DISCOUNT' | 'CASHBACK' | 'FREE_SHIPPING'
  discount_type: 'PERCENTAGE' | 'FIXED'
  discount_value: number
  min_transaction: number
  max_discount: number | null
  usage_limit: number | null
  used_quota: number
  is_active: boolean
  starts_at: string
  expires_at: string | null
  created_at: string
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchVouchers()
  }, [])

  const fetchVouchers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/vouchers')
      const result = await response.json()

      if (!result.success) throw new Error(result.message)
      setVouchers(result.data || [])
    } catch (error) {
      console.error('Error fetching vouchers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveVoucher = async (voucherData: Partial<Voucher>) => {
    try {
      if (editingVoucher) {
        // Update via API
        const response = await fetch('/api/admin/vouchers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVoucher.id, ...voucherData }),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.message)
        toast.success('Voucher berhasil diupdate')
      } else {
        // Create via API
        const response = await fetch('/api/admin/vouchers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voucherData),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.message)
        toast.success('Voucher berhasil dibuat')
      }
      await fetchVouchers()
      setShowModal(false)
      setEditingVoucher(null)
    } catch (error) {
      console.error('Error saving voucher:', error)
      toast.error('Gagal menyimpan voucher')
    }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (!confirm('Yakin ingin menghapus voucher ini?')) return

    try {
      const response = await fetch(`/api/admin/vouchers?id=${voucherId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      toast.success('Voucher berhasil dihapus')
      fetchVouchers()
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('Gagal menghapus voucher')
    }
  }

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const response = await fetch('/api/admin/vouchers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: voucher.id,
          is_active: !voucher.is_active,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      toast.success(`Voucher ${voucher.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchVouchers()
    } catch (error) {
      console.error('Error toggling voucher:', error)
      toast.error('Gagal update status')
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Kode berhasil disalin!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredVouchers = vouchers.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase())
  )

  const getDiscountDisplay = (voucher: Voucher) => {
    if (voucher.discount_type === 'PERCENTAGE') {
      const maxText = voucher.max_discount ? ` (max ${formatCurrency(voucher.max_discount)})` : ''
      return `${voucher.discount_value}%${maxText}`
    }
    return formatCurrency(voucher.discount_value)
  }

  const getStatusBadge = (voucher: Voucher) => {
    if (!voucher.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
          <XCircle size={12} /> Nonaktif
        </span>
      )
    }

    // Check expiration
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
          Expired
        </span>
      )
    }

    // Check usage limit
    if (voucher.usage_limit && voucher.used_quota >= voucher.usage_limit) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
          Habis
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        <CheckCircle size={12} /> Aktif
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Voucher</h1>
          <p className="text-white/60 text-sm mt-1">
            {vouchers.length} voucher ({vouchers.filter(v => v.is_active).length} aktif)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingVoucher(null)
            setShowModal(true)
          }}
        >
          <Plus size={18} />
          Tambah Voucher
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Cari kode voucher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      {/* Vouchers Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-white/50" />
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="bg-surface-primary rounded-xl border border-white/5 p-8 text-center">
            <Ticket size={48} className="mx-auto text-white/20 mb-3" />
            <p className="text-white/50">
              {search ? 'Voucher tidak ditemukan' : 'Belum ada voucher. Tambahkan voucher baru.'}
            </p>
          </div>
        ) : (
          filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-surface-primary rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full font-mono font-bold text-lg">
                      {voucher.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(voucher.code)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-all"
                    >
                      {copiedCode === voucher.code ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                    {getStatusBadge(voucher)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent size={14} className="text-white/50" />
                      <span className="text-white font-medium">
                        {getDiscountDisplay(voucher)}
                      </span>
                      {voucher.discount_type === 'PERCENTAGE' ? 'Diskon' : 'Potongan'}
                    </div>

                    {voucher.min_transaction && (
                      <div className="text-white/50">
                        Min. transaksi: {formatCurrency(voucher.min_transaction)}
                      </div>
                    )}

                    {voucher.usage_limit && (
                      <div className="text-white/50">
                        Terpakai: {voucher.used_quota}/{voucher.usage_limit}
                      </div>
                    )}

                    {voucher.expires_at && (
                      <div className="text-white/50">
                        Berakhir: {formatDate(voucher.expires_at)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(voucher)}
                    className={`p-2 rounded-lg transition-all ${
                      voucher.is_active
                        ? 'text-yellow-400 hover:bg-yellow-500/10'
                        : 'text-green-400 hover:bg-green-500/10'
                    }`}
                    title={voucher.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {voucher.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingVoucher(voucher)
                      setShowModal(true)
                    }}
                    className="p-2 text-white/50 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteVoucher(voucher.id)}
                    className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Voucher Modal */}
      {showModal && (
        <VoucherModal
          voucher={editingVoucher}
          onClose={() => {
            setShowModal(false)
            setEditingVoucher(null)
          }}
          onSave={handleSaveVoucher}
          onDelete={editingVoucher ? () => handleDeleteVoucher(editingVoucher.id) : undefined}
        />
      )}
    </div>
  )
}

// Voucher Modal Component
function VoucherModal({
  voucher,
  onClose,
  onSave,
  onDelete,
}: {
  voucher: Voucher | null
  onClose: () => void
  onSave: (data: Partial<Voucher>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    code: voucher?.code || '',
    type: voucher?.type || 'DISCOUNT' as 'DISCOUNT' | 'CASHBACK' | 'FREE_SHIPPING',
    discount_type: voucher?.discount_type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED',
    discount_value: voucher?.discount_value?.toString() || '',
    max_discount: voucher?.max_discount?.toString() || '',
    min_transaction: voucher?.min_transaction?.toString() || '',
    usage_limit: voucher?.usage_limit?.toString() || '',
    expires_at: voucher?.expires_at ? voucher.expires_at.split('T')[0] : '',
  })

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'TKV'
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, code })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-white/5 w-full max-w-md">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {voucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Kode Voucher</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="flex-1 px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-primary-500"
                placeholder="TKVXXXXXX"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-all"
              >
                Generate
              </button>
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Tipe Diskon</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, discount_type: 'PERCENTAGE' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  form.discount_type === 'PERCENTAGE'
                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/50'
                    : 'bg-dark-100 text-white/70 border-white/10 hover:border-white/20'
                }`}
              >
                Persentase (%)
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, discount_type: 'FIXED' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                  form.discount_type === 'FIXED'
                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/50'
                    : 'bg-dark-100 text-white/70 border-white/10 hover:border-white/20'
                }`}
              >
                Nominal (Rp)
              </button>
            </div>
          </div>

          {/* Discount Value */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Nilai Diskon ({form.discount_type === 'PERCENTAGE' ? '%' : 'Rp'})
            </label>
            <input
              type="number"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder={form.discount_type === 'PERCENTAGE' ? '10' : '10000'}
            />
          </div>

          {/* Max Discount (for percentage) */}
          {form.discount_type === 'PERCENTAGE' && (
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Maksimal Diskon (Rp) - Opsional
              </label>
              <input
                type="number"
                value={form.max_discount}
                onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="5000"
              />
            </div>
          )}

          {/* Min Transaction */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Minimal Transaksi (Rp) - Opsional
            </label>
            <input
              type="number"
              value={form.min_transaction}
              onChange={(e) => setForm({ ...form, min_transaction: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="50000"
            />
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Batas Penggunaan - Opsional
            </label>
            <input
              type="number"
              value={form.usage_limit}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="100"
            />
          </div>

          {/* Expires At */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Tanggal Kadaluarsa - Opsional
            </label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="w-full px-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-400 hover:text-red-300"
            >
              Hapus
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => onSave({
                code: form.code,
                name: form.code,
                type: form.type,
                discount_type: form.discount_type as 'PERCENTAGE' | 'FIXED',
                discount_value: parseInt(form.discount_value),
                max_discount: form.max_discount ? parseInt(form.max_discount) : null,
                min_transaction: form.min_transaction ? parseInt(form.min_transaction) : 0,
                usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
                expires_at: form.expires_at || null,
              })}
              disabled={!form.code || !form.discount_value}
            >
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
