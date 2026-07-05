'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import {
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  Shield,
  CreditCard,
  User,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Mail,
  Phone,
} from 'lucide-react'

const faqCategories = [
  {
    id: 'topup',
    title: 'Cara Top Up',
    icon: Clock,
    questions: [
      {
        q: 'Bagaimana cara top up di Topup Kilat?',
        a: 'Berikut langkah-langkah top up di Topup Kilat:\n\n1. Pilih game yang ingin kamu top up\n2. Masukkan User ID dan Server ID (jika diperlukan)\n3. Pilih nominal diamond/UC yang diinginkan\n4. Masukkan kode voucher jika ada\n5. Login atau daftar akun\n6. Pilih metode pembayaran\n7. Lakukan pembayaran\n8. Diamond/UC akan masuk otomatis ke akun kamu',
      },
      {
        q: 'Berapa lama proses top up?',
        a: 'Proses top up di Topup Kilat sangat cepat, biasanya hanya membutuhkan waktu 1-5 menit setelah pembayaran terkonfirmasi. Pada kondisi tertentu seperti saat server sedang padat atau ada maintenance dari pihak game, proses bisa memakan waktu lebih lama.',
      },
      {
        q: 'Apakah top up aman?',
        a: 'Ya, top up di Topup Kilat sangat aman. Kami menggunakan enkripsi SSL untuk melindungi data transaksi Anda. Selain itu, kami hanya bekerja sama dengan supplier resmi dan terpercaya.',
      },
      {
        q: 'Apa yang harus dilakukan jika diamond tidak masuk?',
        a: 'Jika diamond tidak masuk setelah melakukan pembayaran, silakan:\n\n1. Cek riwayat transaksi di menu "Riwayat Transaksi"\n2. Pastikan pembayaran sudah berhasil\n3. Hubungi customer service kami via chat atau WhatsApp dengan menyertakan invoice number',
      },
    ],
  },
  {
    id: 'pembayaran',
    title: 'Pembayaran',
    icon: CreditCard,
    questions: [
      {
        q: 'Metode pembayaran apa saja yang tersedia?',
        a: 'Topup Kilat menyediakan berbagai metode pembayaran:\n\n• QRIS - Semua bank & e-wallet\n• E-Wallet: GoPay, OVO, DANA, ShopeePay\n• Virtual Account: BCA, BNI, Mandiri, BRI, Permata\n• Transfer Bank langsung',
      },
      {
        q: 'Apakah ada biaya tambahan?',
        a: 'Tidak ada biaya tambahan untuk semua transaksi di Topup Kilat. Harga yang Anda bayar adalah harga yang tertera, kecuali jika Anda menggunakan voucher promo yang memberikan diskon.',
      },
      {
        q: 'Bagaimana jika pembayaran saya gagal?',
        a: 'Jika pembayaran gagal, silakan:\n\n1. Cek kembali apakah saldo Anda cukup\n2. Pastikan kode pembayaran/VA belum expired\n3. Coba ulangi pembayaran\n4. Jika masalah terus berlanjut, hubungi customer service',
      },
      {
        q: 'Berapa lama masa berlaku pembayaran?',
        a: 'Masa berlaku pembayaran adalah 60 menit (1 jam) sejak invoice dibuat. Jika tidak dilakukan pembayaran dalam waktu tersebut, invoice akan otomatis expire dan Anda perlu membuat pesanan baru.',
      },
    ],
  },
  {
    id: 'akun',
    title: 'Akun & Login',
    icon: User,
    questions: [
      {
        q: 'Apakah saya harus daftar untuk top up?',
        a: 'Tidak harus. Anda bisa top up sebagai guest tanpa harus login. Namun, dengan mendaftar akun, Anda bisa menikmati fitur seperti:\n\n• Riwayat transaksi lengkap\n• Repeat order lebih cepat\n• Poin loyalitas\n• Notifikasi promo',
      },
      {
        q: 'Bagaimana cara reset password?',
        a: 'Untuk reset password:\n\n1. Klik "Lupa Password" di halaman login\n2. Masukkan email yang terdaftar\n3. Cek email untuk link reset password\n4. Ikuti instruksi untuk membuat password baru',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Ya, data Anda aman di Topup Kilat. Kami mengikuti regulasi UU Perlindungan Data Pribadi (UU PDP) dan tidak akan membagikan data Anda ke pihak ketiga tanpa persetujuan.',
      },
    ],
  },
  {
    id: 'lainnya',
    title: 'Lainnya',
    icon: AlertCircle,
    questions: [
      {
        q: 'Apakah bisa refund/uang kembali?',
        a: 'Refund dapat dilakukan dalam kondisi tertentu:\n\n• Diamond/UC tidak masuk setelah 24 jam\n• Pembayaran double\n• Kesalahan sistem dari pihak Topup Kilat\n\nProses refund membutuhkan waktu 1-7 hari kerja setelah diverifikasi.',
      },
      {
        q: 'Bagaimana cara menghubungi customer service?',
        a: 'Anda bisa menghubungi customer service Topup Kilat melalui:\n\n• Chat live di website (jam operasional 08.00 - 22.00 WIB)\n• WhatsApp: +62 812-3456-7890\n• Email: support@topupkilat.com',
      },
      {
        q: 'Apakah bisa top up dalam jumlah besar?',
        a: 'Ya, Anda bisa top up dalam jumlah besar. Untuk transaksi dengan nominal sangat besar (di atas Rp 10.000.000), silakan hubungi customer service untuk proses yang lebih optimal.',
      },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter questions based on search
  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0)

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-dark-100/50 py-12 md:py-20">
        <div className="container-page">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pusat{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Bantuan
              </span>
            </h1>
            <p className="text-white/60 mb-8">
              Temukan jawaban untuk pertanyaan Anda atau hubungi tim kami
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Cari pertanyaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-surface-primary rounded-2xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container-page py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: 'Cara Top Up', href: '#topup' },
            { icon: CreditCard, label: 'Pembayaran', href: '#pembayaran' },
            { icon: User, label: 'Akun & Login', href: '#akun' },
            { icon: AlertCircle, label: 'Lainnya', href: '#lainnya' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex flex-col items-center gap-2 p-4 bg-surface-primary rounded-xl border border-white/5 hover:border-primary-500/30 transition-all"
            >
              <link.icon className="w-6 h-6 text-primary-400" />
              <span className="text-sm font-medium text-white">{link.label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="container-page py-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Tidak ada hasil
            </h3>
            <p className="text-white/60">
              Coba gunakan kata kunci lain atau hubungi customer service kami.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id} id={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{category.title}</h2>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                  {category.questions.map((item, index) => {
                    const questionId = `${category.id}-${index}`
                    const isExpanded = expandedQuestion === questionId

                    return (
                      <motion.div
                        key={questionId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface-primary rounded-xl border border-white/5 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedQuestion(isExpanded ? null : questionId)
                          }
                          className="w-full flex items-center justify-between p-4 text-left"
                        >
                          <span className="font-medium text-white pr-4">{item.q}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-white/50 flex-shrink-0 transition-transform duration-300 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 text-white/70 whitespace-pre-line">
                                {item.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact CTA */}
      <section className="container-page py-16">
        <div className="bg-gradient-to-r from-primary-900/50 to-accent-purple/20 rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Masih ada pertanyaan?
            </h2>
            <p className="text-white/70 mb-8">
              Tim customer service kami siap membantu Anda 24/7
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all"
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>
              <a
                href="mailto:support@topupkilat.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-primary border border-white/10 text-white font-semibold rounded-xl hover:bg-surface-secondary transition-all"
              >
                <Mail size={20} />
                Email
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
