import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileNav } from '@/components/layout/MobileNav'

export const metadata: Metadata = {
  title: {
    default: 'Topup Kilat - Top Up Game Tercepat & Termurah',
    template: '%s | Topup Kilat',
  },
  description:
    'Top up diamond, UC, CP, dan mata uang virtual game favorit dengan harga termurah dan proses tercepat. Mendukung Mobile Legends, Free Fire, Genshin Impact, dan 100+ game lainnya.',
  keywords: [
    'top up game',
    'beli diamond',
    'top up mobile legends',
    'top up free fire',
    'jual diamond murah',
    'top up UC',
    'top up CP',
  ],
  authors: [{ name: 'Topup Kilat' }],
  creator: 'Topup Kilat',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://topupkilat.com',
    siteName: 'Topup Kilat',
    title: 'Topup Kilat - Top Up Game Tercepat & Termurah',
    description:
      'Top up diamond, UC, CP, dan mata uang virtual game favorit dengan harga termurah dan proses tercepat.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Topup Kilat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Topup Kilat - Top Up Game Tercepat & Termurah',
    description:
      'Top up diamond, UC, CP, dan mata uang virtual game favorit dengan harga termurah dan proses tercepat.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-dark-50">
        <Header />
        <main className="pt-16 md:pt-20 pb-20 md:pb-8">
          {children}
        </main>
        <Footer />
        <MobileNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
