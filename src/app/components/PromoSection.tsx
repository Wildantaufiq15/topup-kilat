'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { type Promo } from '@/types'

interface PromoSectionProps {
  promos: Promo[]
}

export function PromoSection({ promos }: PromoSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!promos.length) return null

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)
  }

  if (promos.length === 1) {
    return (
      <section className="container-page py-6">
        <a
          href={promos[0].link || '#'}
          className="relative block overflow-hidden rounded-2xl group"
        >
          <div className="relative h-40 md:h-56">
            <Image
              src={promos[0].image}
              alt={promos[0].title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/80 to-accent-purple/80" />
            <div className="absolute inset-0 flex items-center">
              <div className="container-page">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-3">
                    <Sparkles size={14} />
                    Promo
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {promos[0].title}
                  </h3>
                  <p className="text-white/80 text-sm hidden sm:block">
                    {promos[0].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </section>
    )
  }

  return (
    <section className="container-page py-6">
      <div className="relative overflow-hidden rounded-2xl group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="relative h-40 md:h-56"
          >
            <Image
              src={promos[currentIndex].image}
              alt={promos[currentIndex].title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/80 to-accent-purple/80" />
            <div className="absolute inset-0 flex items-center">
              <div className="container-page w-full">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-3">
                    <Sparkles size={14} />
                    Promo
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {promos[currentIndex].title}
                  </h3>
                  <p className="text-white/80 text-sm hidden sm:block">
                    {promos[currentIndex].description}
                  </p>
                </div>
              </div>
            </div>
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
          {promos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
