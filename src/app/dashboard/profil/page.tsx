'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { User, Mail, Phone, Crown, CreditCard } from 'lucide-react'

export default function ProfilPage() {
  const { profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(profile?.name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const handleSave = async () => {
    // Validate
    const newErrors: typeof errors = {}
    if (!name || name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter'
    }
    if (phone && !/^0\d{9,12}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Format nomor HP tidak valid'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await api.updateProfile({ name, phone: phone || undefined })
      await refreshProfile()
      toast.success('Profil berhasil diperbarui')
      setIsEditing(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal update profil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setName(profile?.name || '')
    setPhone(profile?.phone || '')
    setErrors({})
    setIsEditing(false)
  }

  const getTierBadge = (tier: string | null | undefined) => {
    const tierConfig = {
      BRONZE: { variant: 'default' as const, icon: '🥉' },
      SILVER: { variant: 'default' as const, icon: '🥈' },
      GOLD: { variant: 'warning' as const, icon: '🥇' },
      PLATINUM: { variant: 'glow' as const, icon: '💎' },
    }
    return tierConfig[(tier || 'BRONZE') as keyof typeof tierConfig]
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const tier = getTierBadge(profile?.member_tier)

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Profil Saya</h1>
        <p className="text-white/60">Kelola informasi akun kamu</p>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl">
        <div className="bg-surface-primary rounded-2xl border border-white/5 p-6 md:p-8">
          {/* Avatar & Name */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile?.name || 'User'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={tier.variant}>
                  {tier.icon} {profile?.member_tier || 'BRONZE'}
                </Badge>
                {profile?.is_verified && (
                  <Badge variant="success">✓ Verified</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Member Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-dark-100/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <CreditCard size={14} />
                <span>Saldo Poin</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {profile?.points_balance?.toLocaleString('id-ID') || 0}
              </p>
            </div>
            <div className="bg-dark-100/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Crown size={14} />
                <span>Tier</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {tier.icon} {profile?.member_tier || 'BRONZE'}
              </p>
            </div>
            <div className="bg-dark-100/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <span>📅</span>
                <span>Member Sejak</span>
              </div>
              <p className="text-lg font-bold text-white">
                {formatDate(profile?.created_at || null)}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Informasi Akun</h3>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <>
                <Input
                  label="Nama Lengkap"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  error={errors.name}
                  leftIcon={<User size={18} />}
                />

                <Input
                  label="Nomor HP"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  error={errors.phone}
                  hint="Opsional. Digunakan untuk notifikasi."
                  leftIcon={<Phone size={18} />}
                />

                <div className="bg-dark-100/50 rounded-xl p-4">
                  <Input
                    label="Email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    leftIcon={<Mail size={18} />}
                  />
                  <p className="text-xs text-white/40 mt-2">
                    Email tidak dapat diubah
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="accent"
                    onClick={handleSave}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    Simpan
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-dark-100/50 rounded-xl p-4">
                  <label className="text-sm text-white/50 mb-1 block">Nama Lengkap</label>
                  <p className="text-white flex items-center gap-2">
                    <User size={16} />
                    {profile?.name || '-'}
                  </p>
                </div>

                <div className="bg-dark-100/50 rounded-xl p-4">
                  <label className="text-sm text-white/50 mb-1 block">Email</label>
                  <p className="text-white flex items-center gap-2">
                    <Mail size={16} />
                    {profile?.email || '-'}
                  </p>
                </div>

                <div className="bg-dark-100/50 rounded-xl p-4">
                  <label className="text-sm text-white/50 mb-1 block">Nomor HP</label>
                  <p className="text-white flex items-center gap-2">
                    <Phone size={16} />
                    {profile?.phone || '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
