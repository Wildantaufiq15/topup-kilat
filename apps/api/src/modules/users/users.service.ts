import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        memberTier: true,
        pointsBalance: true,
        isVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        memberTier: true,
        pointsBalance: true,
      },
    });

    return user;
  }

  async getPointsHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [points, total] = await Promise.all([
      this.prisma.pointsLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pointsLedger.count({ where: { userId } }),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pointsBalance: true },
    });

    return {
      points,
      balance: user?.pointsBalance || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWishlist(userId: string) {
    const wishlists = await this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        game: {
          include: {
            products: {
              where: { isActive: true },
              take: 5,
              orderBy: { price: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlists.map((w) => w.game);
  }

  async addToWishlist(userId: string, gameId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    if (existing) {
      return { message: 'Game sudah ada di wishlist' };
    }

    await this.prisma.wishlist.create({
      data: { userId, gameId },
    });

    return { message: 'Game ditambahkan ke wishlist' };
  }

  async removeFromWishlist(userId: string, gameId: string) {
    await this.prisma.wishlist.delete({
      where: {
        userId_gameId: {
          userId,
          gameId,
        },
      },
    });

    return { message: 'Game dihapus dari wishlist' };
  }
}
