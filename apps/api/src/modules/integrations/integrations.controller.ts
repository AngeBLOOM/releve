import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get('status')
  getStatus() { return this.svc.getAllStatuses(); }

  @Post(':channel/test')
  testChannel(@Param('channel') channel: string) { return this.svc.testConnection(channel); }

  @Patch(':channel/webhook')
  toggleWebhook(@Param('channel') channel: string, @Body() body: { active: boolean }) {
    return this.svc.toggleWebhook(channel, body.active);
  }

  @Get('bot-config')
  getBotConfig() { return this.svc.getBotConfig(); }

  @Put('bot-config')
  updateBotConfig(@Body() body: Record<string, unknown>) { return this.svc.updateBotConfig(body); }
}
