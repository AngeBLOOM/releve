import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { BotReply } from '../../bot/bot.service';

@Injectable()
export class MessengerProvider {
  private readonly logger = new Logger(MessengerProvider.name);
  private readonly token = process.env.MESSENGER_PAGE_ACCESS_TOKEN ?? '';

  async send(recipientId: string, reply: BotReply): Promise<void> {
    const payload = this.buildPayload(recipientId, reply);
    try {
      await axios.post('https://graph.facebook.com/v19.0/me/messages', payload, {
        params: { access_token: this.token },
      });
    } catch (err: any) {
      this.logger.error(`Error Messenger → ${recipientId}`, err.response?.data);
    }
  }

  private buildPayload(recipientId: string, reply: BotReply) {
    const base = { recipient: { id: recipientId }, messaging_type: 'RESPONSE' };
    if (reply.type === 'INTERACTIVE' && reply.buttons?.length) {
      return {
        ...base,
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: reply.text,
              buttons: reply.buttons.map(b => ({
                type: 'postback',
                title: b.title.substring(0, 20),
                payload: b.id,
              })),
            },
          },
        },
      };
    }
    return { ...base, message: { text: reply.text ?? '' } };
  }
}
