'use client'

import { motion } from 'framer-motion'
import { type PaymentMethod } from '@/types'
import { cn } from '@/lib/utils'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null
  onSelect: (method: PaymentMethod) => void
}

interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: React.ReactNode
  description?: string
}

const paymentOptions: PaymentOption[][] = [
  // QRIS
  [
    {
      id: 'qris',
      name: 'QRIS',
      description: 'Semua bank & e-wallet',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
          <rect x="2" y="2" width="8" height="8" rx="1" />
          <rect x="14" y="2" width="8" height="8" rx="1" />
          <rect x="2" y="14" width="8" height="8" rx="1" />
          <rect x="16" y="14" width="2" height="2" />
          <rect x="20" y="14" width="2" height="2" />
          <rect x="16" y="18" width="2" height="2" />
          <rect x="20" y="18" width="2" height="2" />
          <rect x="16" y="20" width="2" height="2" />
          <rect x="18" y="16" width="2" height="2" />
          <rect x="20" y="20" width="2" height="2" />
        </svg>
      ),
    },
  ],
  // E-Wallets
  [
    {
      id: 'gopay',
      name: 'GoPay',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" fill="#00AA13" />
          <path d="M8 14.5c0-1.5 1-2.5 2-3s2.5-1 4-1c1 0 1.5.5 1.5 1s-.5 1-1.5 1h-4c-.5 0-.5.5-.5 1s.5 1 1 1c1 0 2-.5 2.5-1.5" fill="white" />
        </svg>
      ),
    },
    {
      id: 'ovo',
      name: 'OVO',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" fill="#005698" />
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">OVO</text>
        </svg>
      ),
    },
    {
      id: 'dana',
      name: 'DANA',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" fill="#118EEA" />
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">DANA</text>
        </svg>
      ),
    },
    {
      id: 'shopeepay',
      name: 'ShopeePay',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" fill="#EE4D2D" />
          <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">SPay</text>
        </svg>
      ),
    },
  ],
  // Virtual Accounts
  [
    {
      id: 'bcava',
      name: 'BCA Virtual Account',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#005BA6" />
          <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">BCA</text>
        </svg>
      ),
    },
    {
      id: 'bniva',
      name: 'BNI Virtual Account',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#D6001C" />
          <text x="12" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">BNI</text>
        </svg>
      ),
    },
    {
      id: 'mandiriva',
      name: 'Mandiri Virtual Account',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#00A859" />
          <text x="12" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">Mandiri</text>
        </svg>
      ),
    },
    {
      id: 'briva',
      name: 'BRI Virtual Account',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#5FB020" />
          <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">BRI</text>
        </svg>
      ),
    },
    {
      id: 'permatava',
      name: 'Permata Virtual Account',
      icon: (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#0068B2" />
          <text x="12" y="15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">Permata</text>
        </svg>
      ),
    },
  ],
]

export function PaymentMethodSelector({ selected, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-6">
      {paymentOptions.map((group, groupIndex) => (
        <div key={groupIndex}>
          <h4 className="text-sm font-medium text-white/60 mb-3">
            {groupIndex === 0 && 'QRIS'}
            {groupIndex === 1 && 'E-Wallet'}
            {groupIndex === 2 && 'Virtual Account'}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {group.map((option) => {
              const isSelected = selected === option.id
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(option.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
                    isSelected
                      ? 'bg-primary-500/10 border-primary-500 shadow-glow-primary'
                      : 'bg-dark-100 border-white/5 hover:border-white/20'
                  )}
                >
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div className="text-left">
                    <span className="block font-medium text-white text-sm">
                      {option.name}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-white/50">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="ml-auto w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Mobile-friendly compact version
export function PaymentMethodCompact({ selected, onSelect }: PaymentMethodSelectorProps) {
  const allOptions = paymentOptions.flat()

  return (
    <div className="space-y-2">
      {allOptions.map((option) => {
        const isSelected = selected === option.id
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300',
              isSelected
                ? 'bg-primary-500/10 border-primary-500'
                : 'bg-dark-100 border-white/5 hover:border-white/20'
            )}
          >
            <div className="flex-shrink-0 w-8 h-8">{option.icon}</div>
            <span className="flex-1 text-left font-medium text-white text-sm">
              {option.name}
            </span>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
