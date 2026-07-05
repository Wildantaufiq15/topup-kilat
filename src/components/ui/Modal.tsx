'use client'

import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-dark-400/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full bg-surface-primary rounded-2xl border border-white/10 shadow-2xl',
            'animate-scale-in',
            sizes[size]
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 pb-0">
              <div>
                {title && (
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-white/60">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </Fragment>
  )
}

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const buttonVariants = {
    danger: 'bg-red-600 hover:bg-red-500 shadow-red-500/25',
    warning: 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/25',
    default: 'bg-primary-600 hover:bg-primary-500 shadow-primary-500/25',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {description && (
        <p className="text-white/70 mb-6">{description}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary text-white/80 hover:bg-surface-tertiary transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-xl text-white font-semibold',
            'shadow-lg transition-all hover:scale-105 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            buttonVariants[variant]
          )}
        >
          {isLoading ? 'Memuat...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}
