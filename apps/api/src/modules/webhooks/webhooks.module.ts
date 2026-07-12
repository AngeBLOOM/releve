import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { MessageProcessor } from './message.processor';
import { BotModule } from '../bot/bot.module';
import { MessagingModule } from '../messaging/messaging.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'incoming-messages' }),
    BotModule,
    MessagingModule,
    CustomersModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, MessageProcessor],
})
export class WebhooksModule {}
