import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findByGame(gameId: string) {
    return this.prisma.gameProduct.findMany({
      where: {
        gameId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.gameProduct.findUnique({
      where: { id },
      include: { game: true },
    });
  }
}
