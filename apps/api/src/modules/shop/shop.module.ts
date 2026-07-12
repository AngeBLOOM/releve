import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { CatalogModule } from '../catalog/catalog.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [CatalogModule, MessagingModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
