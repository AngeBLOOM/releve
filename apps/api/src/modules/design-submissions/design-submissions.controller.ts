import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DesignSubmissionsService } from './design-submissions.service';

@Controller('design-submissions')
export class DesignSubmissionsController {
  constructor(private readonly svc: DesignSubmissionsService) {}

  /** Público: la tienda (simulador/producto) envía el diseño del cliente. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('status') status?: string) {
    return this.svc.findAll(status);
  }

  @Get('unseen-count')
  @UseGuards(JwtAuthGuard)
  unseen() {
    return this.svc.unseenCount();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(id, body.status);
  }
}
