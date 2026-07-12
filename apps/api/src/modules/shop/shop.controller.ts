import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';
import { writeFileSync } from 'fs';
import { ShopService } from './shop.service';

/** Tienda pública — SIN autenticación (cara al cliente). */
@Controller('shop')
export class ShopController {
  constructor(private readonly shop: ShopService) {}

  @Get('products')
  products(@Query('category') category?: string) {
    return this.shop.getProducts(category);
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.shop.getProduct(id);
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() body: any) {
    return this.shop.quote(body);
  }

  @Post('orders')
  createOrder(@Body() body: any) {
    return this.shop.createOrder(body);
  }

  /** Subida del archivo de diseño del cliente. Devuelve la URL pública. */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  upload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const ok = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/.test(file.mimetype);
    if (!ok) throw new BadRequestException('Formato no permitido (usa PNG, JPG, WEBP o PDF)');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    writeFileSync(join(process.cwd(), 'uploads', filename), file.buffer);
    const base = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';
    return { url: `${base}/uploads/${filename}`, fileName: file.originalname, mimeType: file.mimetype };
  }
}
