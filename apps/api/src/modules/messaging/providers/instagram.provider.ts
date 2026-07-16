import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BotReply } from '../../bot/bot.service';

@Injectable()
export class InstagramProvider {
  private readonly logger = new Logger(InstagramProvider.name);
  // Instagram (vía Messenger Platform) usa el token de la página. Si no hay uno
  // específico de Instagram, reutiliza el de Messenger (misma página).
  private readonly token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';

  async send(recipientId: string, reply: BotReply): Promise<void> {
    const payload = this.buildPayload(recipientId, reply);
    try {
      await axios.post('https://graph.facebook.com/v19.0/me/messages', payload, {
        params: { access_token: this.token },
      });
    } catch (err: any) {
      this.logger.error(`Error Instagram → ${recipientId}`, err.response?.data);
    }
  }

  private buildPayload(recipientId: string, reply: BotReply) {
    const base = { recipient: { id: recipientId } };
    if (reply.type === 'INTERACTIVE' && reply.buttons?.length) {
      return {
        ...base,
        message: {
          text: reply.text,
          quick_replies: reply.buttons.map(b => ({
            content_type: 'text',
            title: b.title.substring(0, 20),
            payload: b.id,
          })),
        },
      };
    }
    return { ...base, message: { text: reply.text ?? '' } };
  }
}
