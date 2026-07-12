import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { InstagramProvider } from './providers/instagram.provider';
import { MessengerProvider } from './providers/messenger.provider';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secret',
    }),
  ],
  controllers: [ConversationsController],
  providers: [MessagingService, MessagingGateway, ConversationsService, WhatsAppProvider, InstagramProvider, MessengerProvider],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
