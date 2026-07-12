import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotSessionService } from './bot-session.service';
import { MainMenuFlow } from './flows/main-menu.flow';
import { QuoteFlow } from './flows/quote.flow';
import { OrderStatusFlow } from './flows/order-status.flow';
import { LlmService } from './llm/llm.service';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  providers: [
    BotService,
    BotSessionService,
    MainMenuFlow,
    QuoteFlow,
    OrderStatusFlow,
    LlmService,
  ],
  exports: [BotService],
})
export class BotModule {}
