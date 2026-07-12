import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  findAll() { return this.inventory.findAll(); }

  @Get('alerts')
  getLowStock() { return this.inventory.getLowStockAlerts(); }

  @Post(':itemId/movement')
  addMovement(@Param('itemId') itemId: string, @Body() body: any) {
    return this.inventory.addMovement(itemId, body);
  }
}
