import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MessagingService } from './messaging.service';
import { ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  /** Lista de conversaciones para la bandeja, con cliente y último mensaje. */
  async findAll(limit = 50) {
    return this.prisma.conversation.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, displayName: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, direction: true },
        },
      },
    });
  }

  /** Mensajes de una conversación en orden cronológico. */
  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        direction: true,
        sender: true,
        content: true,
        createdAt: true,
      },
    });
  }

  /** Detalle del cliente y sus pedidos (panel lateral). */
  async getDetail(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: {
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
            },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');
    return { customer: conversation.customer, orders: conversation.customer.orders };
  }

  /** Un agente humano envía un mensaje manual. */
  async sendAgentMessage(conversationId: string, content: string, agent = 'Agente') {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: 'OUTBOUND',
        sender: agent,
        content,
        messageType: 'TEXT',
      },
      select: { id: true, direction: true, sender: true, content: true, createdAt: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Envío real al canal (best-effort: si faltan tokens de Meta no rompe la UI)
    try {
      await this.messaging.send(conversation.channel, conversation.channelId, { type: 'TEXT', text: content });
    } catch (err) {
      this.logger.warn(`No se pudo enviar al canal ${conversation.channel}: ${(err as Error).message}`);
    }

    return message;
  }

  /** Cambia el estado: tomar control humano o devolver al bot. */
  async updateStatus(conversationId: string, status: ConversationStatus) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversación no encontrada');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
      include: { customer: { select: { id: true, displayName: true } } },
    });
  }
}
