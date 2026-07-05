import { Suspense } from 'react'
import { GameCardSkeleton } from '@/components/ui/Skeleton'
import { GameGrid } from '@/components/game/GameGrid'
import { HeroSection } from './components/HeroSection'
import { PromoSection } from './components/PromoSection'
import { PopularGamesSection } from './components/PopularGamesSection'
import { FeatureSection } from './components/FeatureSection'
import { TestimonialSection } from './components/TestimonialSection'

// Mock data - akan diganti dengan API call
import { mockGames, mockPromos } from './data/mockData'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Promo Banner */}
      <PromoSection promos={mockPromos} />

      {/* Popular Games */}
      <section className="container-page py-12">
        <PopularGamesSection games={mockGames} />
      </section>

      {/* Features */}
      <FeatureSection />

      {/* Testimonials */}
      <TestimonialSection />

      {/* CTA Section */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-accent-purple p-8 md:p-12">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-cyan rounded-full blur-3xl" />
          </div>
          <div className="relative text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Siap Top Up Sekarang?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Ribuan gamers sudah percaya Topup Kilat untuk kebutuhan top up mereka. Bergabung sekarang dan rasakan kemudahan transaksi!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/games"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-600 font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl"
              >
                Mulai Top Up
              </a>
              <a
                href="/bantuan"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
