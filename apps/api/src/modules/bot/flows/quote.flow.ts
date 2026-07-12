import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PricingCalculatorService } from '../../catalog/pricing/pricing-calculator.service';
import { BotSessionService, BotState } from '../bot-session.service';
import { BotContext, BotReply } from '../bot.service';
import { SublimationType } from '@prisma/client';

@Injectable()
export class QuoteFlow {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingCalculatorService,
    private readonly session: BotSessionService,
  ) {}

  async start(ctx: BotContext): Promise<BotReply> {
    await this.session.set(ctx.conversationId, {
      currentFlow: 'QUOTE',
      currentStep: 'ASK_PRODUCT',
      context: {},
    });
    return this.askProduct();
  }

  async handle(ctx: BotContext, state: BotState): Promise<BotReply> {
    switch (state.currentStep) {
      case 'ASK_PRODUCT':  return this.handleProductSelection(ctx, state);
      case 'ASK_VARIANT':  return this.handleVariantSelection(ctx, state);
      case 'ASK_SUBLIM':   return this.handleSublimSelection(ctx, state);
      case 'ASK_QTY':      return this.handleQuantity(ctx, state);
      case 'ASK_DESIGN':   return this.handleDesignQuestion(ctx, state);
      case 'CONFIRM':      return this.handleConfirmation(ctx, state);
      default:             return this.askProduct();
    }
  }

  private async askProduct(): Promise<BotReply> {
    const products = await this.prisma.baseProduct.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    const list = products.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    return { type: 'TEXT', text: `¿Qué producto deseas personalizar? 🎁\n\n${list}\n\nEscribe el número de tu opción.` };
  }

  private async handleProductSelection(ctx: BotContext, state: BotState): Promise<BotReply> {
    const products = await this.prisma.baseProduct.findMany({ where: { isActive: true } });
    const idx = parseInt(ctx.text ?? '', 10) - 1;
    if (isNaN(idx) || !products[idx]) {
      return { type: 'TEXT', text: 'Por favor escribe el número de la opción 👆' };
    }
    const selected = products[idx];
    await this.session.set(ctx.conversationId, {
      currentStep: 'ASK_VARIANT',
      context: { baseProductId: selected.id, baseProductName: selected.name },
    });
    const variants = await this.prisma.productVariant.findMany({
      where: { baseProductId: selected.id, isActive: true },
    });
    const list = variants.map((v, i) => `${i + 1}. ${v.label}`).join('\n');
    return { type: 'TEXT', text: `¡Perfecto! *${selected.name}* 🎨\n\nElige la variante:\n\n${list}` };
  }

  private async handleVariantSelection(ctx: BotContext, state: BotState): Promise<BotReply> {
    const { baseProductId } = state.context as { baseProductId: string };
    const variants = await this.prisma.productVariant.findMany({
      where: { baseProductId, isActive: true },
    });
    const idx = parseInt(ctx.text ?? '', 10) - 1;
    if (isNaN(idx) || !variants[idx]) {
      return { type: 'TEXT', text: 'Escribe el número de la variante 👆' };
    }
    const variant = variants[idx];
    await this.session.set(ctx.conversationId, {
      currentStep: 'ASK_SUBLIM',
      context: { variantId: variant.id, variantLabel: variant.label },
    });
    return {
      type: 'TEXT',
      text: '¿Qué tipo de sublimación necesitas? 🖨️\n\n1. Logo pequeño (pecho)\n2. Media frente\n3. Frente completa\n4. Frente y dorso completo\n5. Taza completa (A4)\n6. Tamaño grande (A3)',
    };
  }

  private async handleSublimSelection(ctx: BotContext, state: BotState): Promise<BotReply> {
    const map: Record<string, SublimationType> = {
      '1': 'LOGO_SMALL', '2': 'HALF_FRONT', '3': 'FULL_FRONT',
      '4': 'FULL_FRONT_BACK', '5': 'A4', '6': 'A3',
    };
    const sublimType = map[ctx.text?.trim() ?? ''];
    if (!sublimType) return { type: 'TEXT', text: 'Escribe el número del tipo de sublimación 👆' };
    await this.session.set(ctx.conversationId, {
      currentStep: 'ASK_QTY',
      context: { sublimationType: sublimType },
    });
    return { type: 'TEXT', text: '¿Cuántas unidades necesitas? 🔢\n_(Mayor cantidad = mejor precio)_' };
  }

  private async handleQuantity(ctx: BotContext, state: BotState): Promise<BotReply> {
    const quantity = parseInt(ctx.text ?? '', 10);
    if (isNaN(quantity) || quantity < 1) return { type: 'TEXT', text: 'Por favor escribe un número válido 🔢' };

    const c = state.context as any;
    try {
      const quote = await this.pricing.calculate({
        baseProductId: c.baseProductId,
        variantId: c.variantId,
        sublimationType: c.sublimationType,
        quantity,
      });
      await this.session.set(ctx.conversationId, {
        currentStep: 'ASK_DESIGN',
        context: { quantity, quoteTotal: quote.total.toFixed(2), quoteBreakdown: quote.breakdown, pricingRuleId: quote.pricingRuleId },
      });
      return {
        type: 'TEXT',
        text: `📋 *Resumen de tu cotización:*\n\n• Producto: ${c.baseProductName} (${c.variantLabel})\n• Tipo: ${c.sublimationType.replace('_', ' ')}\n• Cantidad: ${quantity} unidad(es)\n\n${quote.breakdown}\n\n¿Ya tienes el diseño listo? Responde *Sí* o *No* 🎨`,
      };
    } catch {
      return { type: 'TEXT', text: 'No encontré precio para esa combinación. Te conecto con un asesor 🙋' };
    }
  }

  private async handleDesignQuestion(ctx: BotContext, state: BotState): Promise<BotReply> {
    const answer = ctx.text?.trim().toLowerCase() ?? '';
    await this.session.set(ctx.conversationId, {
      currentStep: 'CONFIRM',
      context: { hasDesign: answer.startsWith('s') },
    });
    const note = answer.startsWith('s')
      ? 'Perfecto, podrás enviarlo después de confirmar el pedido. 📎'
      : 'No te preocupes, ofrecemos diseño básico gratuito para pedidos de 5+ unidades 🎨';
    return { type: 'TEXT', text: `${note}\n\n¿Confirmamos la cotización? Responde *Confirmar* o *Cancelar*.` };
  }

  private async handleConfirmation(ctx: BotContext, state: BotState): Promise<BotReply> {
    const answer = ctx.text?.trim().toLowerCase() ?? '';
    if (!answer.includes('confirm')) {
      await this.session.clear(ctx.conversationId);
      return { type: 'TEXT', text: 'Pedido cancelado. Escribe *Menú* cuando quieras volver a empezar 😊' };
    }
    const c = state.context as any;
    const order = await this.prisma.order.create({
      data: {
        customerId: ctx.customerId,
        status: 'PENDING_DESIGN',
        channel: ctx.channel.toUpperCase() as any,
        subtotal: parseFloat(c.quoteTotal),
        discount: 0,
        total: parseFloat(c.quoteTotal),
        paymentStatus: 'PENDING',
        deliveryType: 'PICKUP',
        items: {
          create: {
            variantId: c.variantId,
            sublimationType: c.sublimationType,
            quantity: c.quantity,
            unitPrice: parseFloat(c.quoteTotal) / c.quantity,
            subtotal: parseFloat(c.quoteTotal),
          },
        },
        statusHistory: { create: { status: 'PENDING_DESIGN', changedBy: 'BOT' } },
      },
      select: { orderNumber: true },
    });
    await this.session.clear(ctx.conversationId);
    return {
      type: 'TEXT',
      text: `✅ *¡Pedido creado exitosamente!*\n\n📋 N° de pedido: *${order.orderNumber}*\n\n*Próximos pasos:*\n1. Envíanos tu diseño (PNG 300 DPI o PDF vectorial)\n2. Realiza el adelanto del 50% para iniciar producción\n\nConsulta el estado escribiendo: *Estado ${order.orderNumber}*\n\n¿Necesitas algo más? 😊`,
    };
  }
}
