import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Validate game and product
    const game = await this.prisma.game.findUnique({
      where: { slug: dto.gameSlug, isActive: true },
    });

    if (!game) {
      throw new BadRequestException('Game tidak ditemukan');
    }

    const product = await this.prisma.gameProduct.findUnique({
      where: { id: dto.productId, isActive: true },
    });

    if (!product || product.gameId !== game.id) {
      throw new BadRequestException('Produk tidak ditemukan');
    }

    // Validate voucher if provided
    let discount = 0;
    let voucherId: string | null = null;

    if (dto.voucherCode) {
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: dto.voucherCode },
      });

      if (!voucher || !voucher.isActive) {
        throw new BadRequestException('Voucher tidak valid');
      }

      if (voucher.startDate > new Date() || voucher.endDate < new Date()) {
        throw new BadRequestException('Voucher sudah kadaluarsa');
      }

      if (voucher.quota <= voucher.usedQuota) {
        throw new BadRequestException('Kuota voucher sudah habis');
      }

      if (Number(product.price) < Number(voucher.minTransaction)) {
        throw new BadRequestException(`Minimal transaksi Rp ${Number(voucher.minTransaction).toLocaleString('id-ID')}`);
      }

      // Calculate discount
      if (voucher.discountType === 'PERCENTAGE') {
        discount = (Number(product.price) * Number(voucher.discountValue)) / 100;
        if (voucher.maxDiscount) {
          discount = Math.min(discount, Number(voucher.maxDiscount));
        }
      } else {
        discount = Number(voucher.discountValue);
      }

      voucherId = voucher.id;
    }

    const subtotal = Number(product.price);
    const total = Math.max(0, subtotal - discount);

    // Generate invoice number
    const invoiceNo = this.generateInvoiceNo();

    // Calculate expiry (60 minutes from now)
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + 60);

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          invoiceNo,
          userId: userId || null,
          gameId: game.id,
          productId: product.id,
          userGameId: dto.userGameId,
          serverId: dto.serverId || null,
          voucherId,
          voucherCode: dto.voucherCode || null,
          subtotal,
          discount,
          total,
          idempotencyKey: dto.idempotencyKey,
          expiredAt,
        },
        include: {
          game: true,
          product: true,
        },
      });

      // Update voucher usage if used
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: { usedQuota: { increment: 1 } },
        });
      }

      return newOrder;
    });

    return order;
  }

  async findById(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        game: true,
        product: true,
        payment: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    // Check access (allow if no userId or matches order userId)
    if (userId && order.userId && order.userId !== userId) {
      throw new NotFoundException('Order tidak ditemukan');
    }

    return order;
  }

  async findByInvoice(invoiceNo: string) {
    return this.prisma.order.findUnique({
      where: { invoiceNo },
      include: {
        game: true,
        product: true,
        payment: true,
      },
    });
  }

  async findByUser(userId: string, params?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = params || {};
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          game: true,
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkout(orderId: string, userId: string, dto: { paymentMethod: string }) {
    const order = await this.findById(orderId, userId);

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Order tidak dapat dibayar');
    }

    if (order.expiredAt < new Date()) {
      throw new BadRequestException('Order sudah expired');
    }

    // Create payment and get payment URL
    const payment = await this.paymentsService.createPayment(order, dto.paymentMethod);

    return {
      order,
      payment,
    };
  }

  private generateInvoiceNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TK${year}${month}${day}${random}`;
  }
}
