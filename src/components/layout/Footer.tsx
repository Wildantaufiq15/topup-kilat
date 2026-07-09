'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Instagram, Twitter, Youtube } from 'lucide-react'

const footerLinks = {
  produk: [
    { label: 'Semua Game', href: '/games' },
    { label: 'Promo', href: '/promo' },
    { label: 'Cek Transaksi', href: '/lacak' },
  ],
  bantuan: [
    { label: 'FAQ', href: '/bantuan' },
    { label: 'Cara Top Up', href: '/bantuan/cara-topup' },
    { label: 'Hubungi Kami', href: '/bantuan/kontak' },
  ],
  perusahaan: [
    { label: 'Tentang Kami', href: '/tentang' },
    { label: 'Syarat & Ketentuan', href: '/syarat' },
    { label: 'Kebijakan Privasi', href: '/privasi' },
  ],
}

const socialLinks = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'YouTube' },
]

export function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-white/5 mt-20">
      <div className="container-page py-12 md:py-16">
        {/* Main Footer */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo-topup-kilat.png"
                alt="Topup Kilat"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-contain"
              />
            </Link>
            <p className="text-white/60 text-sm mb-6 max-w-xs">
              Platform top up game terpercaya di Indonesia. Proses cepat, harga termurah, dan keamanan terjamin.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Mail size={16} className="text-primary-400" />
                <span>support@topupkilat.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Phone size={16} className="text-primary-400" />
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin size={16} className="text-primary-400" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-xl bg-surface-primary flex items-center justify-center text-white/60 hover:text-white hover:bg-primary-600 transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produk</h4>
            <ul className="space-y-2">
              {footerLinks.produk.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Bantuan</h4>
            <ul className="space-y-2">
              {footerLinks.bantuan.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Perusahaan</h4>
            <ul className="space-y-2">
              {footerLinks.perusahaan.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 mt-12 pt-8">
          {/* Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <span className="text-xs text-white/40">Mendukung:</span>
            {['BCA', 'BNI', 'Mandiri', 'BRI', 'GoPay', 'OVO', 'DANA', 'QRIS'].map((method) => (
              <span
                key={method}
                className="px-3 py-1 text-xs font-medium bg-surface-primary rounded-lg text-white/60"
              >
                {method}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} Topup Kilat. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
