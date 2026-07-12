import { Injectable } from '@nestjs/common';
import { BotSessionService } from './bot-session.service';
import { MainMenuFlow } from './flows/main-menu.flow';
import { QuoteFlow } from './flows/quote.flow';
import { OrderStatusFlow } from './flows/order-status.flow';
import { LlmService } from './llm/llm.service';

export interface BotContext {
  conversationId: string;
  customerId: string;
  channel: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
}

export interface BotReply {
  type: 'TEXT' | 'INTERACTIVE' | 'TEMPLATE';
  text?: string;
  buttons?: Array<{ id: string; title: string }>;
}

@Injectable()
export class BotService {
  constructor(
    private readonly session: BotSessionService,
    private readonly mainMenu: MainMenuFlow,
    private readonly quote: QuoteFlow,
    private readonly orderStatus: OrderStatusFlow,
    private readonly llm: LlmService,
  ) {}

  async handle(ctx: BotContext): Promise<BotReply | null> {
    const state = await this.session.get(ctx.conversationId);

    if (this.requestsHuman(ctx.text)) {
      await this.session.clear(ctx.conversationId);
      return { type: 'TEXT', text: '¡Claro! Te conecto con uno de nuestros asesores. Un momento... 🙋' };
    }

    const menuSelection = MainMenuFlow.parseSelection(ctx.text ?? '');

    if (state?.currentFlow === 'QUOTE') return this.quote.handle(ctx, state);
    if (state?.currentFlow === 'ORDER_STATUS') return this.orderStatus.handle(ctx, state);

    if (menuSelection === 'CATALOG') {
      await this.session.clear(ctx.conversationId);
      const store = process.env.STORE_PUBLIC_URL;
      const link = store ? `\n\n🛍️ *Míralo todo aquí:* ${store}/tienda` : '';
      return { type: 'TEXT', text: `📋 *Nuestro catálogo Relevé:*\n\n👕 Franelas personalizadas (claros y oscuros)\n💑 Combo Dúo para parejas\n🧥 Suéteres / sudaderas\n🧢 Gorras sublimadas\n🏅 Uniformes deportivos full sublimación\n☕ Tazas 11oz${link}\n\n¿Qué te interesa? Dime y te cotizo 💜` };
    }
    if (menuSelection === 'QUOTE') return this.quote.start(ctx);
    if (menuSelection === 'ORDER_STATUS') return this.orderStatus.start(ctx);
    if (menuSelection === 'HUMAN') {
      await this.session.clear(ctx.conversationId);
      return { type: 'TEXT', text: '¡Claro! Te conecto con un asesor. Un momento... 🙋' };
    }

    if (!state?.currentFlow || this.isMenuTrigger(ctx.text)) {
      return this.mainMenu.handle(ctx);
    }

    return this.llm.ask(ctx.text ?? '', ctx.conversationId);
  }

  private requestsHuman(text?: string): boolean {
    if (!text) return false;
    return /\b(humano|agente|persona|asesor|ayuda|0)\b/i.test(text);
  }

  private isMenuTrigger(text?: string): boolean {
    if (!text) return false;
    return /^(hola|hi|hello|inicio|menu|menú|start|\*|buenas|buenos)$/i.test(text.trim());
  }
}
