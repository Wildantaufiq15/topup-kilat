'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Link } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  maxSize?: number // in MB
  folder?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
  showPreview?: boolean
}

export function ImageUploader({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 2, // 2MB default
  folder = 'game-logos',
  className,
  aspectRatio = 'square',
  showPreview = true,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: '',
  }

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSize}MB`)
      return
    }

    setIsUploading(true)

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const filepath = `${folder}/${filename}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('game-images')
        .upload(filepath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('game-images')
        .getPublicUrl(filepath)

      onChange(urlData.publicUrl)
    } catch (err: any) {
      console.error('Upload error:', err)
      // Fallback to base64 if storage upload fails
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        onChange(base64)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }, [maxSize, folder, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput('')
      setShowUrlInput(false)
    }
  }, [urlInput, onChange])

  const handleClear = useCallback(() => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onChange])

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preview Area */}
      {showPreview && value && (
        <div className={cn('relative rounded-lg overflow-hidden bg-dark-100', aspectRatioClasses[aspectRatio])}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      {!value && !showUrlInput && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="space-y-2"
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
              'hover:border-primary-500/50 hover:bg-primary-500/5',
              isDragging
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-white/10 bg-dark-100/50',
              isUploading && 'pointer-events-none opacity-50',
              aspectRatioClasses[aspectRatio]
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {isUploading ? (
                <>
                  <Loader2 size={32} className="text-primary-400 animate-spin mb-2" />
                  <p className="text-sm text-white/60">Mengupload...</p>
                </>
              ) : (
                <>
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                    isDragging ? 'bg-primary-500/20' : 'bg-white/5'
                  )}>
                    {isDragging ? (
                      <Upload size={24} className="text-primary-400" />
                    ) : (
                      <ImageIcon size={24} className="text-white/40" />
                    )}
                  </div>
                  <p className="text-sm text-white/60 text-center mb-1">
                    {isDragging ? 'Lepaskan file di sini' : 'Seret gambar ke sini atau klik untuk pilih'}
                  </p>
                  <p className="text-xs text-white/40">
                    Format: JPG, PNG, WEBP (Max {maxSize}MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* URL Toggle */}
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="w-full py-2 text-xs text-white/50 hover:text-white/70 bg-dark-100/50 hover:bg-dark-100 rounded-lg border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Link size={12} />
            Gunakan URL gambar
          </button>
        </div>
      )}

      {/* URL Input */}
      {!value && showUrlInput && (
        <div className="space-y-2">
          <div className="relative">
            <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://example.com/image.png"
              className="w-full pl-9 pr-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 placeholder-white/30"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(false)}
              className="flex-1 py-2 text-xs text-white/50 hover:text-white/70 bg-dark-100/50 hover:bg-dark-100 rounded-lg border border-white/5 transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="flex-1 py-2 text-xs font-medium bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
            >
              Gunakan URL
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

// Simple URL input for image
interface ImageURLInputProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
}

export function ImageURLInput({ value, onChange, placeholder }: ImageURLInputProps) {
  return (
    <div className="relative">
      <ImageIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'https://example.com/image.png'}
        className="w-full pl-9 pr-3 py-2 bg-dark-100 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500 placeholder-white/30"
      />
    </div>
  )
}
