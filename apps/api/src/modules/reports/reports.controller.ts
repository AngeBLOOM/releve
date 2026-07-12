import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Query('period') period = '30d') { return this.reports.getDashboard(period); }

  @Get('sales-by-day')
  getSalesByDay(@Query('period') period = '30d') { return this.reports.getSalesByDay(period); }

  @Get('top-products')
  getTopProducts(@Query('limit') limit = '5') { return this.reports.getTopProducts(parseInt(limit)); }

  @Get('orders-by-channel')
  getOrdersByChannel() { return this.reports.getOrdersByChannel(); }

  @Get('orders-by-status')
  getOrdersByStatus() { return this.reports.getOrdersByStatus(); }
}
