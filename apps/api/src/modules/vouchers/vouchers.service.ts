import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const [vouchers, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voucher.count({ where: { isActive: true } }),
    ]);

    return {
      vouchers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async validate(code: string, amount?: number) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher tidak ditemukan');
    }

    if (!voucher.isActive) {
      throw new NotFoundException('Voucher tidak aktif');
    }

    const now = new Date();
    if (voucher.startDate > now || voucher.endDate < now) {
      throw new NotFoundException('Voucher sudah kadaluarsa');
    }

    if (voucher.quota <= voucher.usedQuota) {
      throw new NotFoundException('Kuota voucher sudah habis');
    }

    if (amount && Number(voucher.minTransaction) > amount) {
      throw new NotFoundException(
        `Minimal transaksi Rp ${Number(voucher.minTransaction).toLocaleString('id-ID')}`,
      );
    }

    // Calculate discount
    let discount = 0;
    if (amount) {
      if (voucher.discountType === 'PERCENTAGE') {
        discount = (amount * Number(voucher.discountValue)) / 100;
        if (voucher.maxDiscount) {
          discount = Math.min(discount, Number(voucher.maxDiscount));
        }
      } else {
        discount = Number(voucher.discountValue);
      }
    }

    return {
      valid: true,
      voucher: {
        code: voucher.code,
        name: voucher.name,
        discountType: voucher.discountType,
        discountValue: Number(voucher.discountValue),
        maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
        discount,
      },
    };
  }

  async findActive() {
    const now = new Date();
    return this.prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        quota: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
