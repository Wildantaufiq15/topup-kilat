import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingOrders,
      topGames,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['SUCCESS', 'PAID'] } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['SUCCESS', 'PAID'] }, createdAt: { gte: startOfToday } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['SUCCESS', 'PAID'] }, createdAt: { gte: startOfWeek } },
      }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['SUCCESS', 'PAID'] }, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      this.prisma.order.groupBy({
        by: ['gameId'],
        _count: true,
        orderBy: { _count: { gameId: 'desc' } },
        take: 5,
      }),
    ]);

    // Get game names for top games
    const gameIds = topGames.map((g) => g.gameId);
    const games = await this.prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true, name: true },
    });

    const topGamesWithNames = topGames.map((g) => ({
      ...games.find((game) => game.id === g.gameId),
      orderCount: g._count,
    }));

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
      },
      revenue: {
        total: Number(totalRevenue._sum.total) || 0,
        today: Number(todayRevenue._sum.total) || 0,
        week: Number(weekRevenue._sum.total) || 0,
        month: Number(monthRevenue._sum.total) || 0,
      },
      pendingOrders,
      topGames: topGamesWithNames,
    };
  }

  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    gameId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, gameId, dateFrom, dateTo, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (gameId) {
      where.gameId = gameId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { userGameId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          game: { select: { name: true } },
          product: { select: { label: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId: string, status: string, adminId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });

    // Log admin action
    await this.prisma.adminActivityLog.create({
      data: {
        adminId,
        action: 'UPDATE',
        entity: 'orders',
        entityId: orderId,
        changes: { status },
      },
    });

    return order;
  }

  async getUsers(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          memberTier: true,
          pointsBalance: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getActivityLogs(params: { page?: number; limit?: number; adminId?: string }) {
    const { page = 1, limit = 50, adminId } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (adminId) where.adminId = adminId;

    const [logs, total] = await Promise.all([
      this.prisma.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminActivityLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
