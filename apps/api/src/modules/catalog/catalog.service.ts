import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PricingCalculatorService } from './pricing/pricing-calculator.service';
import { SublimationType } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingCalculatorService,
  ) {}

  findAllProducts(category?: string) {
    return this.prisma.baseProduct.findMany({
      where: category ? { category: category as any } : undefined,
      include: {
        variants: { where: { isActive: true } },
        pricingRules: { where: { isActive: true }, orderBy: { minQuantity: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findProduct(id: string) {
    const product = await this.prisma.baseProduct.findUnique({
      where: { id },
      include: {
        variants: { include: { stockItems: true } },
        pricingRules: { orderBy: [{ sublimationType: 'asc' }, { minQuantity: 'asc' }] },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  createProduct(dto: any) {
    const { variants, ...data } = dto;
    return this.prisma.baseProduct.create({
      data: { ...data, variants: variants?.length ? { create: variants } : undefined },
      include: { variants: true },
    });
  }

  updateProduct(id: string, dto: any) {
    return this.prisma.baseProduct.update({ where: { id }, data: dto });
  }

  async toggleProduct(id: string) {
    const p = await this.prisma.baseProduct.findUnique({ where: { id } });
    if (!p) throw new NotFoundException();
    return this.prisma.baseProduct.update({ where: { id }, data: { isActive: !p.isActive } });
  }

  getPricingRules(productId: string) {
    return this.prisma.pricingRule.findMany({
      where: { baseProductId: productId },
      orderBy: [{ sublimationType: 'asc' }, { minQuantity: 'asc' }],
    });
  }

  createPricingRule(baseProductId: string, dto: any) {
    return this.prisma.pricingRule.create({ data: { ...dto, baseProductId } });
  }

  /** Edita una regla existente (para cambiar el precio desde el panel). */
  updatePricingRule(ruleId: string, dto: any) {
    const data: any = {};
    if (dto.unitPrice !== undefined) data.unitPrice = dto.unitPrice;
    if (dto.minQuantity !== undefined) data.minQuantity = dto.minQuantity;
    if (dto.maxQuantity !== undefined) data.maxQuantity = dto.maxQuantity;
    if (dto.sublimationType !== undefined) data.sublimationType = dto.sublimationType;
    return this.prisma.pricingRule.update({ where: { id: ruleId }, data });
  }

  deletePricingRule(ruleId: string) {
    return this.prisma.pricingRule.delete({ where: { id: ruleId } });
  }

  quote(input: any) {
    return this.pricing.calculate({ ...input, sublimationType: input.sublimationType as SublimationType });
  }
}
