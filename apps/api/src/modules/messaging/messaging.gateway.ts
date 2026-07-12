import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MessagingGateway.name);

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
    try {
      this.jwt.verify(token);
      client.join('agents');
      this.logger.log(`Agente conectado: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    client.leave('agents');
  }

  notifyNewMessage(conversationId: string, message: unknown) {
    this.server.to('agents').emit('message:new', { conversationId, message });
  }

  notifyTakeover(conversationId: string) {
    this.server.to('agents').emit('conversation:takeover', { conversationId });
  }

  notifyNewOrder(order: unknown) {
    this.server.to('agents').emit('order:new', order);
  }
}
