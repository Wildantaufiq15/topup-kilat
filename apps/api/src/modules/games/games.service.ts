import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameCategory } from '@prisma/client';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    category?: GameCategory;
    search?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { category, search, featured, page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [games, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: [
          { featured: 'desc' },
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!game) {
      return null;
    }

    return game;
  }

  async getCategories() {
    const categories = await this.prisma.game.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true,
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count,
    }));
  }

  async getPopular(limit = 8) {
    // For now, return featured games
    // In production, you might track transaction counts
    const games = await this.prisma.game.findMany({
      where: {
        isActive: true,
        featured: true,
      },
      take: limit,
      orderBy: { sortOrder: 'asc' },
    });

    return games;
  }
}
