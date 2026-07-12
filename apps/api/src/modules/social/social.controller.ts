import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('status')
  status() { return this.social.status(); }

  @Get('posts')
  list(@Query('limit') limit = '50') { return this.social.listPosts(parseInt(limit)); }

  @Post('posts')
  create(@Body() dto: any) { return this.social.createPost(dto); }

  @Post('posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string) { return this.social.publishNow(id); }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.social.deletePost(id); }

  @Get('autopilot')
  getAutopilot() { return this.social.getAutopilot(); }

  @Put('autopilot')
  setAutopilot(@Body() dto: any) { return this.social.setAutopilot(dto); }

  @Post('generate/:productId')
  @HttpCode(HttpStatus.OK)
  generate(@Param('productId') productId: string) { return this.social.generateFromProduct(productId); }
}
