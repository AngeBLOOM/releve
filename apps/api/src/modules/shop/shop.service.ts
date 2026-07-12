import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PricingCalculatorService } from '../catalog/pricing/pricing-calculator.service';
import { MessagingGateway } from '../messaging/messaging.gateway';
import { SublimationType } from '@prisma/client';
import Decimal from 'decimal.js';

interface CartItemInput {
  baseProductId: string;
  variantId: string;
  sublimationType: SublimationType;
  quantity: number;
  customNotes?: string;
  designUrl?: string;
  designName?: string;
  designMime?: string;
}

interface CheckoutInput {
  customer: { name: string; phone?: string; email?: string };
  items: CartItemInput[];
  deliveryType?: 'PICKUP' | 'DELIVERY';
  deliveryAddress?: string;
  notes?: string;
}

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingCalculatorService,
    private readonly gateway: MessagingGateway,
  ) {}

  /** Catálogo público: solo productos y variantes activos. */
  getProducts(category?: string) {
    return this.prisma.baseProduct.findMany({
      where: { isActive: true, ...(category ? { category: category as any } : {}) },
      include: {
        variants: {
          where: { isActive: true },
          include: { stockItems: { select: { quantity: true } } },
        },
        pricingRules: { where: { isActive: true }, orderBy: { minQuantity: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.baseProduct.findFirst({
      where: { id, isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          include: { stockItems: { select: { quantity: true } } },
        },
        pricingRules: { where: { isActive: true }, orderBy: [{ sublimationType: 'asc' }, { minQuantity: 'asc' }] },
      },
    });
    if (!product) throw new NotFoundException('Producto no disponible');
    return product;
  }

  quote(input: any) {
    return this.pricing.calculate({ ...input, sublimationType: input.sublimationType as SublimationType });
  }

  /** Crea el pedido desde la tienda pública (canal WEB) y notifica al panel. */
  async createOrder(dto: CheckoutInput) {
    if (!dto?.customer?.name?.trim()) throw new BadRequestException('Falta el nombre del cliente');
    if (!dto?.items?.length) throw new BadRequestException('El carrito está vacío');

    // Recalcula precios en el servidor (nunca confiar en el precio del cliente)
    const priced = [];
    let subtotal = new Decimal(0);
    let discount = new Decimal(0);
    for (const item of dto.items) {
      if (!item.variantId || !item.baseProductId || !item.quantity || item.quantity < 1) {
        throw new BadRequestException('Ítem del carrito inválido');
      }
      const q = await this.pricing.calculate({
        baseProductId: item.baseProductId,
        variantId: item.variantId,
        sublimationType: item.sublimationType,
        quantity: item.quantity,
      });
      subtotal = subtotal.add(q.subtotal);
      discount = discount.add(q.discount);
      priced.push({
        variantId: item.variantId,
        sublimationType: item.sublimationType,
        quantity: item.quantity,
        unitPrice: q.unitPrice.toFixed(2),
        subtotal: q.total.toFixed(2),
        customNotes: item.customNotes?.trim() || null,
      });
    }
    const total = subtotal.sub(discount);

    // Diseños subidos por el cliente → registros OrderDesign
    const designs = dto.items
      .filter((i) => i.designUrl)
      .map((i) => ({
        fileUrl: i.designUrl!,
        fileName: i.designName || 'diseño',
        mimeType: i.designMime || 'image/png',
      }));

    // Cliente: reusar por teléfono si existe, si no crear uno nuevo
    const phone = dto.customer.phone?.trim() || null;
    let customer = phone
      ? await this.prisma.customer.findFirst({ where: { phone } })
      : null;
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          displayName: dto.customer.name.trim(),
          phone,
          email: dto.customer.email?.trim() || null,
        },
      });
    }

    const order = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING_DESIGN',
        channel: 'WEB',
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        paymentStatus: 'PENDING',
        deliveryType: dto.deliveryType === 'DELIVERY' ? 'DELIVERY' : 'PICKUP',
        deliveryAddress: dto.deliveryType === 'DELIVERY' ? dto.deliveryAddress?.trim() || null : null,
        notes: dto.notes?.trim() || null,
        items: { create: priced },
        designs: designs.length ? { create: designs } : undefined,
        statusHistory: { create: { status: 'PENDING_DESIGN', changedBy: 'WEB' } },
      },
      select: { id: true, orderNumber: true, total: true },
    });

    // Notifica al panel en tiempo real
    this.gateway.notifyNewOrder({
      id: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      customer: customer.displayName,
    });

    return { orderNumber: order.orderNumber, total: order.total };
  }
}
