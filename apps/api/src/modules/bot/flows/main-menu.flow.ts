import { Injectable } from '@nestjs/common';
import { BotContext, BotReply } from '../bot.service';
import { BotSessionService } from '../bot-session.service';

@Injectable()
export class MainMenuFlow {
  constructor(private readonly session: BotSessionService) {}

  async handle(ctx: BotContext): Promise<BotReply> {
    await this.session.clear(ctx.conversationId);

    if (ctx.channel === 'whatsapp') {
      return {
        type: 'INTERACTIVE',
        text: '¡Hola! 👋 Bienvenido/a a *Relevé* 💜🎈\n\n¿En qué puedo ayudarte hoy?',
        buttons: [
          { id: 'QUOTE',        title: '💰 Cotizar pedido' },
          { id: 'ORDER_STATUS', title: '📦 Estado de pedido' },
          { id: 'CATALOG',      title: '🛍️ Ver catálogo' },
        ],
      };
    }

    return {
      type: 'TEXT',
      text:
        '¡Hola! 👋 Bienvenido/a a *Relevé* 💜🎈\n\n' +
        'Elige una opción:\n\n' +
        '1️⃣ Ver catálogo\n' +
        '2️⃣ Cotizar pedido personalizado\n' +
        '3️⃣ Estado de mi pedido\n' +
        '4️⃣ Hablar con un asesor\n\n' +
        'Escribe el número de tu opción 👇',
    };
  }

  static parseSelection(text: string): string | null {
    const clean = text.trim().toLowerCase();
    const map: Record<string, string> = {
      '1': 'CATALOG', 'catálogo': 'CATALOG', 'catalogo': 'CATALOG',
      '2': 'QUOTE',   'cotizar': 'QUOTE',    'cotización': 'QUOTE', 'precio': 'QUOTE',
      '3': 'ORDER_STATUS', 'pedido': 'ORDER_STATUS', 'estado': 'ORDER_STATUS',
      '4': 'HUMAN',   'asesor': 'HUMAN',     'agente': 'HUMAN',
      'catalog': 'CATALOG', 'quote': 'QUOTE', 'order_status': 'ORDER_STATUS',
    };
    return map[clean] ?? null;
  }
}
