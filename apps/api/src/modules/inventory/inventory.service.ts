import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.inventoryItem.findMany({
      include: {
        variant: { include: { baseProduct: { select: { name: true, category: true } } } },
        movements: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  getLowStockAlerts() {
    return this.prisma.inventoryItem.findMany({
      where: { quantity: { lte: 5 } },
      include: { variant: { include: { baseProduct: { select: { name: true } } } } },
    });
  }

  async addMovement(itemId: string, data: { type: MovementType; quantity: number; reason?: string }) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new BadRequestException('Item no encontrado');

    const newQty = data.type === 'ADJUSTMENT'
      ? data.quantity
      : data.type === 'IN'
        ? item.quantity + data.quantity
        : item.quantity - data.quantity;

    if (newQty < 0) throw new BadRequestException('Stock insuficiente');

    return this.prisma.$transaction([
      this.prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQty } }),
      this.prisma.inventoryMovement.create({ data: { itemId, type: data.type, quantity: data.quantity, reason: data.reason } }),
    ]);
  }
}
