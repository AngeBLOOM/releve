import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('limit') limit = '50',
    @Query('customer') customerId?: string,
  ) {
    return this.orders.findAll({ status, limit: parseInt(limit), customerId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.orders.findOne(id); }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() body: { status: any }) {
    return this.orders.updateStatus(id, body.status);
  }
}
