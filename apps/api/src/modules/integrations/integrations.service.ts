import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async getAllStatuses() {
    return Promise.all([
      this.getChannelStatus('WHATSAPP'),
      this.getChannelStatus('INSTAGRAM'),
      this.getChannelStatus('MESSENGER'),
    ]);
  }

  async getChannelStatus(channel: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER') {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messageCount24h = await this.prisma.message.count({
      where: { conversation: { channel }, createdAt: { gte: since } },
    });
    const lastMessage = await this.prisma.message.findFirst({
      where: { conversation: { channel } },
      orderBy: { createdAt: 'desc' },
    });
    const tokenMap: Record<string, string | undefined> = {
      WHATSAPP: process.env.WHATSAPP_TOKEN,
      INSTAGRAM: process.env.INSTAGRAM_ACCESS_TOKEN,
      MESSENGER: process.env.MESSENGER_PAGE_ACCESS_TOKEN,
    };
    const connected = !!tokenMap[channel] && !tokenMap[channel]!.includes('reemplazar');
    const webhookActive = (await this.redis.get(`webhook:active:${channel.toLowerCase()}`)) !== '0';
    const accountInfo = await this.redis.get(`account:info:${channel.toLowerCase()}`);
    const info = accountInfo ? JSON.parse(accountInfo) : {};
    return { channel, connected, webhookActive: connected && webhookActive, accountName: info.name, phoneNumber: info.phone, lastMessageAt: lastMessage?.createdAt, messageCount24h };
  }

  async testConnection(channel: string) {
    try {
      if (channel === 'whatsapp') {
        const res = await axios.get(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, {
          params: { access_token: process.env.WHATSAPP_TOKEN, fields: 'display_phone_number,verified_name' },
        });
        await this.redis.setex(`account:info:whatsapp`, 3600, JSON.stringify({ name: res.data.verified_name, phone: res.data.display_phone_number }));
        return { success: true, name: res.data.verified_name };
      }
      const token = channel === 'instagram' ? process.env.INSTAGRAM_ACCESS_TOKEN : process.env.MESSENGER_PAGE_ACCESS_TOKEN;
      const res = await axios.get('https://graph.facebook.com/v19.0/me', { params: { access_token: token, fields: 'name,id' } });
      await this.redis.setex(`account:info:${channel}`, 3600, JSON.stringify({ name: res.data.name }));
      return { success: true, name: res.data.name };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error?.message ?? err.message };
    }
  }

  async toggleWebhook(channel: string, active: boolean) {
    await this.redis.set(`webhook:active:${channel.toLowerCase()}`, active ? '1' : '0');
    return { channel, webhookActive: active };
  }

  async getBotConfig() {
    const raw = await this.redis.get('bot:config');
    return raw ? JSON.parse(raw) : {
      botEnabled: true,
      welcomeMessage: '¡Hola! 💜 Soy Relevé, tu asistente. ¿En qué puedo ayudarte hoy?',
      offHoursMessage: 'Estamos fuera de horario. Te responderemos el próximo día hábil.',
      workHoursStart: '08:00',
      workHoursEnd: '18:00',
      autoHumanTransfer: true,
    };
  }

  async updateBotConfig(config: Record<string, unknown>) {
    await this.redis.set('bot:config', JSON.stringify(config));
    return config;
  }
}
