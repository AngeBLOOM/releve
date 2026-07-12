import {
  Controller, Get, Post, Body, Headers,
  Param, Query, RawBodyRequest, Req,
  HttpCode, HttpStatus, Logger, BadRequestException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';
import * as crypto from 'crypto';

@Controller('webhook')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Get(':channel')
  verifyWebhook(
    @Param('channel') channel: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = process.env.META_VERIFY_TOKEN;
    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log(`Webhook verificado para canal: ${channel}`);
      return challenge;
    }
    throw new BadRequestException('Token de verificación inválido');
  }

  @Post(':channel')
  @HttpCode(HttpStatus.OK)
  async receiveEvent(
    @Param('channel') channel: string,
    @Body() payload: unknown,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    const secret = process.env.META_APP_SECRET;
    const secretConfigured = !!secret && !/reemplazar|tu_app_secret|placeholder/i.test(secret);
    if (signature && req.rawBody && secretConfigured) {
      this.validateSignature(req.rawBody, signature);
    } else if (signature && !secretConfigured) {
      this.logger.warn('META_APP_SECRET no configurado: se omite la validación de firma del webhook (solo para pruebas).');
    }
    await this.webhooksService.enqueue(channel, payload);
    return { status: 'received' };
  }

  private validateSignature(rawBody: Buffer, signature: string): void {
    const expected = 'sha256=' + crypto
      .createHmac('sha256', process.env.META_APP_SECRET ?? '')
      .update(rawBody)
      .digest('hex');
    if (!crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature.padEnd(expected.length, ' ')),
    )) {
      throw new BadRequestException('Firma inválida');
    }
  }
}
