import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { PricingCalculatorService } from './pricing/pricing-calculator.service';

@Module({
  providers: [CatalogService, PricingCalculatorService],
  controllers: [CatalogController],
  exports: [CatalogService, PricingCalculatorService],
})
export class CatalogModule {}
