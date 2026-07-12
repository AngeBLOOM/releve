import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DatabaseModule } from './database/database.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { BotModule } from './modules/bot/bot.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { ShopModule } from './modules/shop/shop.module';
import { SocialModule } from './modules/social/social.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),

    RedisModule.forRoot({
      type: 'single',
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST ?? 'localhost'}:${process.env.REDIS_PORT ?? 6379}`,
    }),

    DatabaseModule,
    AuthModule,
    WebhooksModule,
    MessagingModule,
    BotModule,
    CatalogModule,
    OrdersModule,
    InventoryModule,
    CustomersModule,
    ReportsModule,
    IntegrationsModule,
    ShopModule,
    SocialModule,
  ],
})
export class AppModule {}
