import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { MessengerProvider } from './providers/messenger.provider';
import { BotReply } from '../bot/bot.service';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly whatsapp: WhatsAppProvider,
    private readonly instagram: InstagramProvider,
    private readonly messenger: MessengerProvider,
    private readonly gateway: MessagingGateway,
  ) {}

  async send(channel: string, recipientId: string, reply: BotReply): Promise<void> {
    switch (channel.toLowerCase()) {
      case 'whatsapp':  return this.whatsapp.send(recipientId, reply);
      case 'instagram': return this.instagram.send(recipientId, reply);
      case 'messenger': return this.messenger.send(recipientId, reply);
      default: this.logger.warn(`Canal desconocido: ${channel}`);
    }
  }

  notifyAgents(conversationId: string, payload: unknown) {
    this.gateway.notifyNewMessage(conversationId, payload);
  }
}
