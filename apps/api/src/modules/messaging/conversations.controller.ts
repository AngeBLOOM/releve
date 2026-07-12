import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationStatus } from '@prisma/client';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.conversations.findAll(limit ? parseInt(limit, 10) : 50);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.conversations.getMessages(id);
  }

  @Get(':id/detail')
  getDetail(@Param('id') id: string) {
    return this.conversations.getDetail(id);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() body: { content: string }) {
    return this.conversations.sendAgentMessage(id, body.content);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: ConversationStatus }) {
    return this.conversations.updateStatus(id, body.status);
  }
}
