import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const now = new Date();
    return this.prisma.promo.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBanners() {
    const now = new Date();
    return this.prisma.promo.findMany({
      where: {
        isActive: true,
        position: 'BANNER',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
