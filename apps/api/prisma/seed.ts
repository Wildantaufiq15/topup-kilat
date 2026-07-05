import { PrismaClient, GameCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@topupkilat.com' },
    update: {},
    create: {
      email: 'admin@topupkilat.com',
      name: 'Admin Topup Kilat',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
      isVerified: true,
    },
  });
  console.log('✅ Test user created:', user.email);

  // Create Games
  const gamesData = [
    {
      name: 'Mobile Legends',
      slug: 'mobile-legends',
      category: GameCategory.MOBILE,
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mobilelegendsbangbang.svg',
      description: 'Game MOBA mobile terpopuler di Indonesia',
      requiresServerId: true,
      featured: true,
      sortOrder: 1,
    },
    {
      name: 'Free Fire',
      slug: 'free-fire',
      category: GameCategory.MOBILE,
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlefbsports.svg',
      description: 'Battle royale mobile yang seru dan cepat',
      requiresServerId: true,
      featured: true,
      sortOrder: 2,
    },
    {
      name: 'Genshin Impact',
      slug: 'genshin-impact',
      category: GameCategory.MOBILE,
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mihoyo.svg',
      description: 'Open world RPG dengan grafis memukau',
      requiresServerId: true,
      featured: true,
      sortOrder: 3,
    },
    {
      name: 'PUBG Mobile',
      slug: 'pubg-mobile',
      category: GameCategory.MOBILE,
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/tencentgames.svg',
      description: 'Battle royale mobile dengan grafis AAA',
      requiresServerId: true,
      featured: true,
      sortOrder: 4,
    },
    {
      name: 'Valorant',
      slug: 'valorant',
      category: GameCategory.PC,
      logo: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/valorant.svg',
      description: 'Taktis FPS dari Riot Games',
      requiresServerId: false,
      featured: true,
      sortOrder: 5,
    },
    {
      name: 'Wild Rift',
      slug: 'wild-rift',
      category: GameCategory.MOBILE,
      logo: 'https://placeholder.com/wildrift.png',
      description: 'League of Legends versi mobile',
      requiresServerId: true,
      featured: true,
      sortOrder: 6,
    },
  ];

  for (const gameData of gamesData) {
    const game = await prisma.game.upsert({
      where: { slug: gameData.slug },
      update: gameData,
      create: gameData,
    });
    console.log('✅ Game created:', game.name);
  }

  // Create Products for Mobile Legends
  const mlGame = await prisma.game.findUnique({ where: { slug: 'mobile-legends' } });
  if (mlGame) {
    const mlProducts = [
      { label: '86 Diamonds', price: 20000, supplierCode: 'ML_86', sortOrder: 1 },
      { label: '172 Diamonds', price: 40000, originalPrice: 45000, discount: 11, supplierCode: 'ML_172', sortOrder: 2 },
      { label: '257 Diamonds', price: 60000, supplierCode: 'ML_257', sortOrder: 3 },
      { label: '344 Diamonds', price: 80000, stock: 'LIMITED' as const, supplierCode: 'ML_344', sortOrder: 4 },
      { label: '429 Diamonds', price: 100000, originalPrice: 120000, discount: 17, supplierCode: 'ML_429', sortOrder: 5 },
      { label: '514 Diamonds', price: 120000, supplierCode: 'ML_514', sortOrder: 6 },
      { label: '706 Diamonds', price: 160000, supplierCode: 'ML_706', sortOrder: 7 },
      { label: '878 Diamonds', price: 200000, stock: 'LIMITED' as const, supplierCode: 'ML_878', sortOrder: 8 },
      { label: '1412 Diamonds', price: 320000, originalPrice: 380000, discount: 16, supplierCode: 'ML_1412', sortOrder: 9 },
      { label: '2396 Diamonds', price: 540000, supplierCode: 'ML_2396', sortOrder: 10 },
    ];

    for (const product of mlProducts) {
      await prisma.gameProduct.upsert({
        where: { id: `${mlGame.id}-${product.sortOrder}` },
        update: { ...product, gameId: mlGame.id },
        create: { ...product, id: `${mlGame.id}-${product.sortOrder}`, gameId: mlGame.id },
      });
    }
    console.log('✅ Mobile Legends products created');
  }

  // Create Products for Free Fire
  const ffGame = await prisma.game.findUnique({ where: { slug: 'free-fire' } });
  if (ffGame) {
    const ffProducts = [
      { label: '50 UC', price: 7000, supplierCode: 'FF_50', sortOrder: 1 },
      { label: '100 UC', price: 14000, supplierCode: 'FF_100', sortOrder: 2 },
      { label: '200 UC', price: 27000, originalPrice: 30000, discount: 10, supplierCode: 'FF_200', sortOrder: 3 },
      { label: '500 UC', price: 67000, supplierCode: 'FF_500', sortOrder: 4 },
      { label: '1000 UC', price: 134000, originalPrice: 150000, discount: 11, supplierCode: 'FF_1000', sortOrder: 5 },
      { label: '2000 UC', price: 268000, stock: 'LIMITED' as const, supplierCode: 'FF_2000', sortOrder: 6 },
    ];

    for (const product of ffProducts) {
      await prisma.gameProduct.upsert({
        where: { id: `${ffGame.id}-${product.sortOrder}` },
        update: { ...product, gameId: ffGame.id },
        create: { ...product, id: `${ffGame.id}-${product.sortOrder}`, gameId: ffGame.id },
      });
    }
    console.log('✅ Free Fire products created');
  }

  // Create Vouchers
  const now = new Date();
  const vouchers = [
    {
      code: 'HEMAT10',
      name: 'Diskon 10%',
      description: 'Potongan 10% untuk semua transaksi',
      discountType: 'PERCENTAGE' as const,
      discountValue: 10,
      minTransaction: 50000,
      maxDiscount: 20000,
      quota: 1000,
      usedQuota: 0,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      code: 'PROMO25K',
      name: 'Potongan Rp 25.000',
      description: 'Potongan Rp 25.000 untuk transaksi min Rp 200.000',
      discountType: 'FIXED' as const,
      discountValue: 25000,
      minTransaction: 200000,
      quota: 500,
      usedQuota: 0,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const voucher of vouchers) {
    await prisma.voucher.upsert({
      where: { code: voucher.code },
      update: voucher,
      create: voucher,
    });
  }
  console.log('✅ Vouchers created');

  // Create Promos
  const promos = [
    {
      title: 'Diskon 10% untuk Semua Game!',
      description: 'Nikmati potongan harga 10% untuk semua transaksi top up hari ini.',
      image: '/promos/promo-1.jpg',
      position: 'BANNER' as const,
      startDate: now,
      endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Cashback hingga Rp 50.000',
      description: 'Dapatkan cashback hingga Rp 50.000 untuk transaksi minimum Rp 100.000.',
      image: '/promos/promo-2.jpg',
      position: 'BANNER' as const,
      startDate: now,
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const promo of promos) {
    await prisma.promo.create({ data: promo });
  }
  console.log('✅ Promos created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
