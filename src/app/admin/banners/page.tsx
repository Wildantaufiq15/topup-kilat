'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  GripVertical,
  X,
  Upload,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  image: string
  link: string | null
  type: 'BANNER' | 'POPUP' | 'SLIDER'
  is_active: boolean
  sort_order: number
  starts_at: string
  expires_at: string | null
  created_at: string
}

interface BannerFormData {
  title: string
  subtitle: string
  image: string
  link: string
  type: 'BANNER' | 'POPUP' | 'SLIDER'
  startsAt: string
  expiresAt: string
  isActive: boolean
}

const defaultFormData: BannerFormData = {
  title: '',
  subtitle: '',
  image: '',
  link: '',
  type: 'BANNER',
  startsAt: new Date().toISOString().split('T')[0],
  expiresAt: '',
  isActive: true,
}

export default function AdminBannersPage() {
  const { session } = useAuth()
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [session])

  const fetchBanners = async () => {
    setIsLoading(true)
    try {
      // Build headers with auth token
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      // Use admin API route
      const response = await fetch('/api/admin/promos', { headers })
      const result = await response.json()

      if (!result.success) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Tidak memiliki akses ke data banner')
        }
        throw new Error(result.message || 'Gagal memuat data')
      }
      setBanners(result.data || [])
    } catch (err: any) {
      console.error('Error fetching banners:', err)
      setError(err.message)
      // Fallback to api if admin route fails
      try {
        const data = await api.getAllBanners()
        setBanners(data || [])
      } catch (fallbackErr) {
        // Ignore fallback error, primary error is shown
      }
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingBanner(null)
    setFormData(defaultFormData)
    setImagePreview(null)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image: banner.image,
      link: banner.link || '',
      type: banner.type,
      startsAt: banner.starts_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      expiresAt: banner.expires_at?.split('T')[0] || '',
      isActive: banner.is_active,
    })
    setImagePreview(banner.image)
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBanner(null)
    setFormData(defaultFormData)
    setImagePreview(null)
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // For now, we'll use a placeholder URL
      // In production, you'd upload to storage first
      const placeholderUrl = URL.createObjectURL(file)
      setFormData({ ...formData, image: placeholderUrl })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!formData.title.trim()) throw new Error('Judul banner harus diisi')
      if (!formData.image) throw new Error('Gambar banner harus diisi')

      // Build headers with auth token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const payload = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        image: formData.image,
        link: formData.link || null,
        type: formData.type,
        is_active: formData.isActive,
        sort_order: editingBanner?.sort_order || banners.length + 1,
        starts_at: formData.startsAt,
        expires_at: formData.expiresAt || null,
      }

      if (editingBanner) {
        // Update via API
        const response = await fetch('/api/admin/promos', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ id: editingBanner.id, ...payload }),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.message)
      } else {
        // Create via API
        const response = await fetch('/api/admin/promos', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
        const result = await response.json()
        if (!result.success) throw new Error(result.message)
      }

      await fetchBanners()
      closeModal()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return

    try {
      // Build headers with auth token
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/admin/promos?id=${id}`, {
        method: 'DELETE',
        headers,
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      // Build headers with auth token
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch('/api/admin/promos', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: banner.id,
          is_active: !banner.is_active,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newBanners = [...banners]
    const temp = newBanners[index].sort_order
    newBanners[index].sort_order = newBanners[index - 1].sort_order
    newBanners[index - 1].sort_order = temp

    try {
      await api.updateBanner(newBanners[index].id, { sortOrder: newBanners[index].sort_order })
      await api.updateBanner(newBanners[index - 1].id, { sortOrder: newBanners[index - 1].sort_order })
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return
    const newBanners = [...banners]
    const temp = newBanners[index].sort_order
    newBanners[index].sort_order = newBanners[index + 1].sort_order
    newBanners[index + 1].sort_order = temp

    try {
      await api.updateBanner(newBanners[index].id, { sortOrder: newBanners[index].sort_order })
      await api.updateBanner(newBanners[index + 1].id, { sortOrder: newBanners[index + 1].sort_order })
      await fetchBanners()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const typeLabels: Record<string, string> = {
    BANNER: 'Banner Utama',
    POPUP: 'Popup',
    SLIDER: 'Slider',
  }

  const typeColors: Record<string, string> = {
    BANNER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    POPUP: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    SLIDER: 'bg-green-500/20 text-green-400 border-green-500/30',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kelola Banner</h1>
          <p className="text-white/60 text-sm mt-1">
            Atur banner dan iklan yang tampil di halaman utama
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Tambah Banner
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Banner List */}
      <div className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium w-12">Urutan</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Banner</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-xs text-white/50 font-medium">Berlaku</th>
                <th className="px-4 py-3 text-right text-xs text-white/50 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    Memuat...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    Belum ada banner. Klik &quot;Tambah Banner&quot; untuk membuat yang pertama.
                  </td>
                </tr>
              ) : (
                banners.map((banner, index) => (
                  <tr key={banner.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === banners.length - 1}
                          className="p-1 text-white/30 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-dark-100 flex-shrink-0">
                          <Image
                            src={banner.image || '/placeholder/banner.png'}
                            alt={banner.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{banner.title}</p>
                          {banner.subtitle && (
                            <p className="text-white/50 text-xs truncate max-w-[200px]">{banner.subtitle}</p>
                          )}
                          {banner.link && (
                            <a
                              href={banner.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-400 text-xs hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink size={10} />
                              {banner.link.slice(0, 30)}...
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-1 text-xs font-medium rounded-full border', typeColors[banner.type])}>
                        {typeLabels[banner.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={cn(
                          'relative w-10 h-5 rounded-full transition-colors',
                          banner.is_active ? 'bg-green-500' : 'bg-gray-600'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                            banner.is_active ? 'left-5 translate-x-0' : 'left-0.5'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-white/50">
                        <p>{new Date(banner.starts_at).toLocaleDateString('id-ID')}</p>
                        {banner.expires_at && (
                          <p>s/d {new Date(banner.expires_at).toLocaleDateString('id-ID')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(banner)}
                          className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-dark-200 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">
                {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
              </h2>
              <button onClick={closeModal} className="p-2 text-white/50 hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Gambar Banner</label>
                <div
                  className={cn(
                    'relative border-2 border-dashed border-white/10 rounded-xl overflow-hidden',
                    imagePreview ? 'border-primary-500/50' : ''
                  )}
                >
                  {imagePreview ? (
                    <div className="relative aspect-[3/1]">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setFormData({ ...formData, image: '' })
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg text-white hover:bg-black/70"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
                      <Upload size={32} className="text-white/30 mb-2" />
                      <span className="text-sm text-white/50">Klik untuk upload gambar</span>
                      <span className="text-xs text-white/30 mt-1">PNG, JPG, WebP (Maks 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Judul Banner *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Diskon 20% Top Up ML"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Subtitle / Deskripsi</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Deskripsi singkat banner (opsional)"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Link Tujuan</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com/promo"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Tipe Banner</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'BANNER', label: 'Banner Utama' },
                    { value: 'POPUP', label: 'Popup' },
                    { value: 'SLIDER', label: 'Slider' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as BannerFormData['type'] })}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                        formData.type === type.value
                          ? 'bg-primary-600 border-primary-500 text-white'
                          : 'bg-dark-100 border-white/10 text-white/70 hover:border-white/20'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Tanggal Berakhir</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    placeholder="Tidak terbatas"
                    className="w-full px-4 py-2.5 bg-dark-100 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-white font-medium">Aktifkan Banner</p>
                  <p className="text-xs text-white/50">Banner akan tampil di halaman utama</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors',
                    formData.isActive ? 'bg-green-500' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                      formData.isActive ? 'left-6 translate-x-0' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingBanner ? 'Simpan Perubahan' : 'Tambah Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
