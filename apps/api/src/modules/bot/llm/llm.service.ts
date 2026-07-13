import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../../../database/prisma.service';
import { BotReply } from '../bot.service';
import { buildSalesAgentPrompt } from './prompts/sales-agent.prompt';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI | null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    // La IA es opcional: sin clave, el bot funciona con sus menús normales.
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
    if (!this.client) {
      this.logger.warn('OPENAI_API_KEY no configurada — el bot responderá con los menús (sin IA).');
    }
  }

  async ask(userText: string, conversationId: string): Promise<BotReply> {
    if (!this.client) {
      return {
        type: 'TEXT',
        text: 'Escribe *menú* para ver nuestras opciones, o en un momento te atiende un asesor. 🙋',
      };
    }
    try {
      const history = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      history.reverse();

      const systemPrompt = await this.buildContextualPrompt();

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
          role: (m.direction === 'INBOUND' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: userText },
      ];

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 400,
        temperature: 0.7,
      });

      const text = response.choices[0].message.content ?? 'Lo siento, no pude procesar tu mensaje. 🙏';
      return { type: 'TEXT', text };
    } catch (err) {
      this.logger.error('LLM error', err);
      return { type: 'TEXT', text: 'Tengo un pequeño inconveniente técnico. Un asesor te atenderá en breve 🙋' };
    }
  }

  private async buildContextualPrompt(): Promise<string> {
    const products = await this.prisma.baseProduct.findMany({
      where: { isActive: true },
      include: { pricingRules: { where: { isActive: true } } },
    });

    const catalogSummary = products.map(p => `- ${p.name}: ${p.description ?? ''}`).join('\n');
    const pricingRules = products.flatMap(p =>
      p.pricingRules.map(r =>
        `${p.name} | ${r.sublimationType} | ${r.minQuantity}${r.maxQuantity ? `-${r.maxQuantity}` : '+'} uds. → $${r.unitPrice}`,
      ),
    ).join('\n');

    return buildSalesAgentPrompt({ catalogSummary, pricingRules });
  }
}
