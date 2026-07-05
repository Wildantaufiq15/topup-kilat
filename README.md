# Topup Kilat

Platform top up game tercepat dan paling dipercaya di Indonesia.

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS + Framer Motion
- **State Management**: React Context / Zustand
- **Styling**: Tailwind CSS with custom gaming theme
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── components/         # Page-specific components
│   ├── data/               # Mock data
│   ├── games/              # Games listing page
│   ├── topup/[slug]/       # Top up detail page
│   ├── checkout/           # Checkout page
│   ├── promo/             # Promo page
│   ├── bantuan/           # Help/FAQ page
│   ├── login/             # Login page
│   └── register/          # Register page
├── components/
│   ├── ui/                # Base UI components
│   ├── game/              # Game-specific components
│   └── layout/            # Layout components
├── context/               # React Context providers
├── lib/                   # Utilities and helpers
└── types/                 # TypeScript type definitions
```

## Features (MVP)

- [x] Landing page with game showcase
- [x] Game listing with filters
- [x] Top up detail page with ID validation
- [x] Nominal/product selection
- [x] Checkout flow with payment method selection
- [x] Login/Register pages
- [x] Promo page
- [x] Help/FAQ page
- [ ] Backend API integration
- [ ] Real-time transaction status
- [ ] User dashboard
- [ ] Admin panel

## License

MIT
