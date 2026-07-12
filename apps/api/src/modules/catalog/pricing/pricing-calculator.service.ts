import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SublimationType } from '@prisma/client';
import Decimal from 'decimal.js';

export interface QuoteInput {
  baseProductId: string;
  variantId: string;
  sublimationType: SublimationType;
  quantity: number;
}

export interface QuoteResult {
  unitPrice: Decimal;
  subtotal: Decimal;
  discount: Decimal;
  total: Decimal;
  pricingRuleId: string;
  breakdown: string;
}

@Injectable()
export class PricingCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(input: QuoteInput): Promise<QuoteResult> {
    const { baseProductId, variantId, sublimationType, quantity } = input;

    const rule = await this.prisma.pricingRule.findFirst({
      where: {
        baseProductId,
        sublimationType,
        isActive: true,
        minQuantity: { lte: quantity },
        OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }],
      },
      orderBy: { minQuantity: 'desc' },
    });

    if (!rule) {
      throw new NotFoundException(
        `No hay precio configurado para ese producto/sublimación (qty: ${quantity}).`,
      );
    }

    // Recargo por variante (color/talla) sumado al precio base de la regla
    const variant = variantId
      ? await this.prisma.productVariant.findUnique({ where: { id: variantId }, select: { priceModifier: true } })
      : null;
    const modifier = new Decimal(variant?.priceModifier?.toString() ?? '0');
    const unitPrice = new Decimal(rule.unitPrice.toString()).add(modifier);
    const subtotal = unitPrice.mul(quantity);
    const discountRate = this.bulkDiscountRate(quantity);
    const discount = subtotal.mul(discountRate);
    const total = subtotal.sub(discount);

    return {
      unitPrice,
      subtotal,
      discount,
      total,
      pricingRuleId: rule.id,
      breakdown: this.formatBreakdown(quantity, unitPrice, discount, total),
    };
  }

  private bulkDiscountRate(quantity: number): number {
    if (quantity >= 50) return 0.10;
    if (quantity >= 20) return 0.07;
    if (quantity >= 10) return 0.05;
    return 0;
  }

  private formatBreakdown(qty: number, unit: Decimal, discount: Decimal, total: Decimal): string {
    const lines = [`${qty} unidad(es) × $${unit.toFixed(2)}`];
    if (discount.gt(0)) lines.push(`Descuento por volumen: -$${discount.toFixed(2)}`);
    lines.push(`*Total: $${total.toFixed(2)}*`);
    return lines.join('\n');
  }
}
