import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BotReply } from '../../bot/bot.service';

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);
  private readonly baseUrl = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  private readonly token = process.env.WHATSAPP_TOKEN ?? '';

  async send(to: string, reply: BotReply): Promise<void> {
    const payload = this.buildPayload(to, reply);
    try {
      await axios.post(this.baseUrl, payload, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      this.logger.error(`Error WA → ${to}`, err.response?.data);
    }
  }

  private buildPayload(to: string, reply: BotReply) {
    const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

    if (reply.type === 'INTERACTIVE' && reply.buttons?.length) {
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: reply.text },
          action: {
            buttons: reply.buttons.map(b => ({
              type: 'reply',
              reply: { id: b.id, title: b.title.substring(0, 20) },
            })),
          },
        },
      };
    }

    return { ...base, type: 'text', text: { body: reply.text ?? '', preview_url: false } };
  }
}
