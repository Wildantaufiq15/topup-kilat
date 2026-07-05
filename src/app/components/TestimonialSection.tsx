'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Rizky Pratama',
    role: 'Gamer Mobile Legends',
    avatar: 'RP',
    rating: 5,
    content: 'Sudah 2 tahun top up di Topup Kilat, nggak pernah kecewa. Proses cepet, harga murah, dan CS nya ramah banget!',
    game: 'Mobile Legends',
  },
  {
    name: 'Siti Nurhaliza',
    role: 'Ibu Rumah Tangga',
    avatar: 'SN',
    rating: 5,
    content: 'Awalnya ragu top up online, tapi ternyata aman dan gampang. Anak saya sekarang feliz top up diamond tanpa ribet.',
    game: 'Free Fire',
  },
  {
    name: 'Budi Santoso',
    role: 'Content Creator',
    avatar: 'BS',
    rating: 5,
    content: 'Sebagai content creator, saya butuh top up yang cepat dan reliable. Topup Kilat jadi pilihan utama saya!',
    game: 'Genshin Impact',
  },
]

export function TestimonialSection() {
  return (
    <section className="py-16">
      <div className="container-page">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Apa Kata{' '}
            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
              Mereka?
            </span>
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Ribuan gamer sudah merasakan kemudahan top up di Topup Kilat
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 bg-surface-primary rounded-2xl border border-white/5"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 left-6">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-white/80 mb-6 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                  <div className="text-xs text-white/50">{testimonial.role}</div>
                </div>
                <div className="ml-auto">
                  <span className="px-2 py-1 text-xs bg-dark-100 rounded-lg text-white/50">
                    {testimonial.game}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
