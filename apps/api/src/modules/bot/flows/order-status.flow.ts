import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BotContext, BotReply } from '../bot.service';
import { BotState } from '../bot-session.service';

const STATUS_LABELS: Record<string, string> = {
  PENDING_DESIGN: '✏️ Por diseñar — esperando confirmación del arte',
  PRINT_QUEUE:    '🖨️ En cola de impresión',
  SUBLIMATING:    '🔥 Sublimando — en producción ahora mismo',
  READY:          '✅ Listo para entrega o envío',
  DELIVERED:      '📬 Entregado',
  CANCELLED:      '❌ Cancelado',
};

@Injectable()
export class OrderStatusFlow {
  constructor(private readonly prisma: PrismaService) {}

  async start(ctx: BotContext): Promise<BotReply> {
    const orderNumber = this.extractOrderNumber(ctx.text);
    if (orderNumber) return this.lookupOrder(ctx, orderNumber);
    return { type: 'TEXT', text: 'Por favor escribe tu número de pedido (ej: *ORD-00042*) 📦' };
  }

  async handle(ctx: BotContext, _state: BotState): Promise<BotReply> {
    const orderNumber = this.extractOrderNumber(ctx.text);
    if (!orderNumber) return { type: 'TEXT', text: 'No reconocí ese número. Escríbelo así: *ORD-00042* 🔢' };
    return this.lookupOrder(ctx, orderNumber);
  }

  private async lookupOrder(ctx: BotContext, orderNumber: string): Promise<BotReply> {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber: { equals: orderNumber, mode: 'insensitive' }, customerId: ctx.customerId },
      include: { items: { include: { variant: { include: { baseProduct: true } } } } },
    });

    if (!order) {
      return {
        type: 'TEXT',
        text: `No encontré el pedido *${orderNumber}* asociado a tu cuenta.\nVerifica el número o escribe *Menú* para volver.`,
      };
    }

    const products = order.items.map(i => `• ${i.variant.baseProduct.name} × ${i.quantity}`).join('\n');
    return {
      type: 'TEXT',
      text: `📦 *Pedido ${order.orderNumber}*\n\nEstado: ${STATUS_LABELS[order.status]}\n\nProductos:\n${products}\n\nTotal: $${order.total}\nPago: ${order.paymentStatus === 'PAID' ? '✅ Pagado' : '⏳ Pendiente'}\n\n¿Necesitas algo más? Escribe *Menú* para volver.`,
    };
  }

  private extractOrderNumber(text?: string): string | null {
    if (!text) return null;
    const match = text.match(/[A-Z0-9]{6,}/i) ?? text.match(/ORD[-\s]?\d{4,}/i);
    return match ? match[0].toUpperCase().replace(/\s/, '-') : null;
  }
}
