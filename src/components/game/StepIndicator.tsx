'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  id: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: string
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const isPending = index > currentIndex

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                isCompleted && 'bg-green-500 text-white shadow-lg shadow-green-500/30',
                isActive && 'bg-primary-500 text-white shadow-glow-primary animate-glow-pulse',
                isPending && 'bg-dark-100 text-white/50 border border-white/10'
              )}
            >
              {isCompleted ? <Check size={16} /> : index + 1}
            </div>

            {/* Step Label - hidden on mobile */}
            <span
              className={cn(
                'ml-2 text-sm font-medium hidden sm:block transition-colors duration-300',
                isCompleted && 'text-green-400',
                isActive && 'text-white',
                isPending && 'text-white/50'
              )}
            >
              {step.label}
            </span>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-3 transition-all duration-500',
                  isCompleted ? 'bg-green-500' : 'bg-white/10'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Compact horizontal stepper for mobile
interface CompactStepperProps {
  steps: Step[]
  currentStep: string
  className?: string
}

export function CompactStepper({ steps, currentStep, className }: CompactStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                isCompleted && 'bg-green-500 text-white',
                isActive && 'bg-primary-500 text-white',
                !isCompleted && !isActive && 'bg-dark-100 text-white/50 border border-white/10'
              )}
            >
              {isCompleted ? <Check size={12} /> : index + 1}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1 transition-all duration-500',
                  isCompleted ? 'bg-green-500' : 'bg-white/10'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Progress bar version
interface ProgressStepsProps {
  steps: Step[]
  currentStep: string
  className?: string
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)
  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress Bar */}
      <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-600 to-accent-cyan transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex

          return (
            <span
              key={step.id}
              className={cn(
                'transition-colors duration-300',
                isCompleted && 'text-green-400',
                isActive && 'text-primary-400 font-medium',
                !isCompleted && !isActive && 'text-white/40'
              )}
            >
              {step.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
