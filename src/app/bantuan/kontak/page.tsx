'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Mail, Phone, Clock, Send, CheckCircle } from 'lucide-react'

export default function KontakPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+62 812-3456-7890',
      description: 'Respon cepat, biasanya dalam 1 jam',
      link: 'https://wa.me/6281234567890',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'support@topupkilat.com',
      description: 'Respon dalam 1x24 jam kerja',
      link: 'mailto:support@topupkilat.com',
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      value: '08.00 - 22.00 WIB',
      description: 'Setiap hari, termasuk weekend',
      link: null,
    },
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen">
        <div className="bg-dark-100/50 border-b border-white/5">
          <div className="container-page py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Hubungi{' '}
                <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                  Kami
                </span>
              </h1>
            </motion.div>
          </div>
        </div>
        <div className="container-page py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Pesan Terkirim!</h2>
            <p className="text-white/60 mb-6">
              Terima kasih telah menghubungi kami. Tim customer service akan segera merespons pesan kamu.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false)
                setForm({ name: '', email: '', whatsapp: '', subject: '', message: '' })
              }}
              className="px-6 py-3 bg-surface-primary text-white rounded-xl hover:bg-surface-secondary transition-colors"
            >
              Kirim Pesan Lagi
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-dark-100/50 border-b border-white/5">
        <div className="container-page py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Hubungi{' '}
              <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Kami
              </span>
            </h1>
            <p className="text-white/60">
              Tim customer service kami siap membantu kamu 24/7
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <h2 className="text-xl font-bold text-white mb-6">Metode Kontak</h2>
            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface-primary rounded-xl border border-white/5 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <method.icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{method.title}</h3>
                      {method.link ? (
                        <a
                          href={method.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          {method.value}
                        </a>
                      ) : (
                        <p className="text-white/80">{method.value}</p>
                      )}
                      <p className="text-white/50 text-sm mt-1">{method.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <h2 className="text-xl font-bold text-white mb-6">Kirim Pesan</h2>
            <form onSubmit={handleSubmit} className="bg-surface-primary rounded-2xl border border-white/5 p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Masukkan nama kamu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="08xxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Subjek
                  </label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                    placeholder="Topik pesan kamu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Pesan
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-dark-100 rounded-xl border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                  placeholder="Jelaskan masalah atau pertanyaan kamu..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Kirim Pesan
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
