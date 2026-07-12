import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Channel } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(channel: string, senderId: string) {
    const channelField = channel.toLowerCase() === 'whatsapp' ? 'whatsappId'
      : channel.toLowerCase() === 'instagram' ? 'instagramId'
      : 'messengerId';

    const existing = await this.prisma.customer.findFirst({
      where: { [channelField]: senderId },
    });

    if (existing) return existing;

    return this.prisma.customer.create({
      data: {
        [channelField]: senderId,
        displayName: `Cliente ${senderId.slice(-4)}`,
      },
    });
  }

  findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search ? {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      } : undefined,
      include: {
        _count: { select: { orders: true, conversations: true } },
        orders: { select: { total: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, data: { notes?: string; phone?: string; email?: string }) {
    return this.prisma.customer.update({ where: { id }, data });
  }
}
