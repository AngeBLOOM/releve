import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private periodDate(period: string): Date {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[period] ?? 30;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async getDashboard(period: string) {
    const from = this.periodDate(period);
    const [totalOrders, totalRevenue, newCustomers, pendingOrders, lowStock] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: from }, status: { not: 'CANCELLED' } } }),
      this.prisma.order.aggregate({ where: { createdAt: { gte: from }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      this.prisma.customer.count({ where: { createdAt: { gte: from } } }),
      this.prisma.order.count({ where: { status: { in: ['PENDING_DESIGN', 'PRINT_QUEUE', 'SUBLIMATING'] } } }),
      this.prisma.inventoryItem.count({ where: { quantity: { lte: 5 } } }),
    ]);
    return { totalOrders, totalRevenue: Number(totalRevenue._sum.total ?? 0), newCustomers, pendingOrders, lowStock };
  }

  async getSalesByDay(period: string) {
    const from = this.periodDate(period);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });
    const byDay: Record<string, number> = {};
    for (const o of orders) {
      const day = o.createdAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] ?? 0) + Number(o.total);
    }
    return Object.entries(byDay).map(([date, total]) => ({ date, total }));
  }

  async getTopProducts(limit: number) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['variantId'],
      _sum: { quantity: true, subtotal: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    return Promise.all(items.map(async item => {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { baseProduct: { select: { name: true } } },
      });
      return {
        name: `${variant?.baseProduct.name} - ${variant?.label}`,
        quantity: item._sum.quantity ?? 0,
        revenue: Number(item._sum.subtotal ?? 0),
        orders: item._count,
      };
    }));
  }

  async getOrdersByChannel() {
    const result = await this.prisma.order.groupBy({
      by: ['channel'],
      _count: true,
      where: { status: { not: 'CANCELLED' } },
    });
    return result.map(r => ({ channel: r.channel, count: r._count }));
  }

  async getOrdersByStatus() {
    const result = await this.prisma.order.groupBy({ by: ['status'], _count: true });
    return result.map(r => ({ status: r.status, count: r._count }));
  }
}
