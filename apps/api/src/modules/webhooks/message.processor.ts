import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BotService } from '../bot/bot.service';
import { CustomersService } from '../customers/customers.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../../database/prisma.service';
import { Channel } from '@prisma/client';

interface IncomingJob {
  channel: string;
  payload: Record<string, unknown>;
}

@Processor('incoming-messages')
export class MessageProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly botService: BotService,
    private readonly customersService: CustomersService,
    private readonly messagingService: MessagingService,
  ) {
    super();
  }

  async process(job: Job<IncomingJob>): Promise<void> {
    const { channel, payload } = job.data;
    const normalized = this.normalizePayload(channel, payload);
    if (!normalized) return;

    const { senderId, text, mediaUrl, externalMessageId } = normalized;
    const customer = await this.customersService.findOrCreate(channel, senderId);

    const channelEnum = channel.toUpperCase() as Channel;

    const conversation = await this.prisma.conversation.upsert({
      where: { channelId_channel: { channelId: senderId, channel: channelEnum } },
      create: {
        customerId: customer.id,
        channel: channelEnum,
        channelId: senderId,
        status: 'BOT_ACTIVE',
      },
      update: { updatedAt: new Date() },
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: 'INBOUND',
        sender: customer.displayName,
        content: text ?? '[media]',
        mediaUrl,
        externalId: externalMessageId,
      },
    });

    if (conversation.status === 'HUMAN_TAKEOVER') {
      this.messagingService.notifyAgents(conversation.id, { text, senderId });
      return;
    }

    const reply = await this.botService.handle({
      conversationId: conversation.id,
      customerId: customer.id,
      channel,
      senderId,
      text,
      mediaUrl,
    });

    if (reply) {
      await this.messagingService.send(channel, senderId, reply);
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          sender: 'BOT',
          content: reply.text ?? JSON.stringify(reply),
          messageType: reply.type === 'INTERACTIVE' ? 'INTERACTIVE' : 'TEXT',
        },
      });
    }
  }

  private normalizePayload(channel: string, payload: any) {
    if (channel === 'whatsapp') {
      const entry = payload?.entry?.[0]?.changes?.[0]?.value;
      const msg = entry?.messages?.[0];
      if (!msg) return null;
      return {
        senderId: msg.from as string,
        text: msg.type === 'text' ? msg.text.body : (msg.interactive?.button_reply?.id ?? null),
        mediaUrl: msg.type === 'image' ? msg.image?.url : null,
        externalMessageId: msg.id as string,
      };
    }
    if (channel === 'instagram' || channel === 'messenger') {
      const messaging = payload?.entry?.[0]?.messaging?.[0];
      if (!messaging?.message) return null;
      return {
        senderId: messaging.sender.id as string,
        text: messaging.message.text ?? messaging.postback?.payload ?? null,
        mediaUrl: messaging.message.attachments?.[0]?.payload?.url ?? null,
        externalMessageId: messaging.message.mid as string,
      };
    }
    return null;
  }
}
