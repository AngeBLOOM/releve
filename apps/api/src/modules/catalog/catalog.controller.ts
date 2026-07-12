import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@Controller('catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('products')
  findAll(@Query('category') category?: string) { return this.catalog.findAllProducts(category); }

  @Get('products/:id')
  findOne(@Param('id') id: string) { return this.catalog.findProduct(id); }

  @Post('products')
  create(@Body() dto: any) { return this.catalog.createProduct(dto); }

  @Put('products/:id')
  update(@Param('id') id: string, @Body() dto: any) { return this.catalog.updateProduct(id, dto); }

  @Patch('products/:id/toggle')
  toggle(@Param('id') id: string) { return this.catalog.toggleProduct(id); }

  @Get('products/:id/pricing')
  getPricing(@Param('id') id: string) { return this.catalog.getPricingRules(id); }

  @Post('products/:id/pricing')
  addPricing(@Param('id') productId: string, @Body() dto: any) { return this.catalog.createPricingRule(productId, dto); }

  @Delete('pricing/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePricing(@Param('ruleId') ruleId: string) { return this.catalog.deletePricingRule(ruleId); }

  @Post('quote')
  calculateQuote(@Body() body: any) { return this.catalog.quote(body); }
}
