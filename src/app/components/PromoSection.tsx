'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

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

interface PromoSectionProps {
  promos?: any[] // Backward compatibility
}

export function PromoSection({ promos: propPromos }: PromoSectionProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(!propPromos)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!propPromos) {
      fetchBanners()
    }
  }, [propPromos])

  const fetchBanners = async () => {
    try {
      const data = await api.getBanners()
      setBanners(data || [])
    } catch (error) {
      console.error('Error fetching banners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use prop promos for backward compatibility, otherwise use banners from API
  const displayItems = useMemo(() => {
    if (propPromos && propPromos.length > 0) {
      return propPromos.map(p => ({
        id: p.id,
        title: p.title,
        description: p.subtitle || p.description || '',
        image: p.image,
        link: p.link || '#',
      }))
    }
    return banners.map(b => ({
      id: b.id,
      title: b.title,
      description: b.subtitle || '',
      image: b.image,
      link: b.link || '#',
    }))
  }, [propPromos, banners])

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    if (displayItems.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [displayItems.length])

  if (isLoading || displayItems.length === 0) return null

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayItems.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length)
  }

  // Single banner - no carousel needed
  if (displayItems.length === 1) {
    const item = displayItems[0]
    return (
      <section className="container-page py-6">
        {item.link && item.link !== '#' ? (
          <Link
            href={item.link}
            className="relative block overflow-hidden rounded-2xl group"
          >
            <BannerContent item={item} />
          </Link>
        ) : (
          <div className="relative overflow-hidden rounded-2xl group">
            <BannerContent item={item} />
          </div>
        )}
      </section>
    )
  }

  // Multiple banners - with carousel
  return (
    <section className="container-page py-6">
      <div
        className="relative overflow-hidden rounded-2xl group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            {displayItems[currentIndex].link && displayItems[currentIndex].link !== '#' ? (
              <Link href={displayItems[currentIndex].link} className="block">
                <BannerContent item={displayItems[currentIndex]} />
              </Link>
            ) : (
              <BannerContent item={displayItems[currentIndex]} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all flex items-center justify-center"
        >
          <ChevronRight size={20} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {displayItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function BannerContent({ item }: { item: { title: string; description: string; image: string } }) {
  return (
    <div className="relative h-40 md:h-56">
      <Image
        src={item.image}
        alt={item.title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-100/90 via-dark-100/70 to-dark-100/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="container-page">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-3">
              <Sparkles size={14} />
              Promo
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-white/80 text-sm hidden sm:block">
                {item.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
