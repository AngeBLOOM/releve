import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ status, limit, customerId }: { status?: string; limit: number; customerId?: string }) {
    return this.prisma.order.findMany({
      where: {
        ...(status ? { status: { in: status.split(',') as OrderStatus[] } } : { status: { notIn: ['DELIVERED', 'CANCELLED'] } }),
        ...(customerId ? { customerId } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { displayName: true } },
        items: { include: { variant: { select: { label: true } } } },
      },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { variant: { include: { baseProduct: true } } } },
        designs: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, agentId = 'AGENT') {
    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: { create: { status, changedBy: agentId } },
      },
    });
  }

  async getConversationDetail(conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { customer: true },
    });
    if (!conv) throw new NotFoundException();
    const orders = await this.prisma.order.findMany({
      where: { customerId: conv.customer.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return { customer: conv.customer, orders };
  }
}
