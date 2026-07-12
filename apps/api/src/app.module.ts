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
import { HealthController } from './health.controller';

// Config de Redis: en producción (Render) basta con REDIS_URL; en local se usan
// REDIS_HOST/PORT/PASSWORD del docker-compose.
function redisConnection() {
  const url = process.env.REDIS_URL;
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || '6379'),
      username: u.username || undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      tls: u.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null as null,
    };
  }
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null as null,
  };
}

function redisUrl() {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const pw = process.env.REDIS_PASSWORD;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = process.env.REDIS_PORT ?? '6379';
  return pw ? `redis://:${pw}@${host}:${port}` : `redis://${host}:${port}`;
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    BullModule.forRoot({ connection: redisConnection() }),

    RedisModule.forRoot({ type: 'single', url: redisUrl() }),

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
  controllers: [HealthController],
})
export class AppModule {}
