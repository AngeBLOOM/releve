import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SocialPlatform, PostStatus } from '@prisma/client';
import { SocialPublisherService } from './social-publisher.service';

export interface AutopilotConfig {
  enabled: boolean;
  postsPerDay: number;   // publicaciones por día (dentro del horario activo)
  postsPerHour: number;  // (legado, ya no se usa para la cadencia)
  platforms: SocialPlatform[];
  hourStart: number; // 0-23
  hourEnd: number;   // 0-23
  captionTemplates: string[];
}

const AUTOPILOT_KEY = 'social:autopilot';
const LAST_RUN_KEY = 'social:autopilot:lastRun';
const ROTATION_KEY = 'social:autopilot:rotation';

const DEFAULT_CONFIG: AutopilotConfig = {
  enabled: false,
  postsPerDay: 3,
  postsPerHour: 2,
  platforms: ['FACEBOOK', 'INSTAGRAM'],
  hourStart: 8,
  hourEnd: 21,
  captionTemplates: [
    '✨ {product} personalizado a tu gusto. ¡Sublimación de alta calidad! Desde ${price} 🎨',
    '🔥 ¿Buscas algo único? {product} desde ${price}. Pídelo ya y diséñalo como quieras.',
    '🎁 {product} ideal para regalar o para tu marca. Desde ${price}. ¡Haz tu pedido!',
    '👕☕ {product} con tu diseño. Calidad Relevé desde ${price}.',
  ],
};

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly publisher: SocialPublisherService,
    @InjectQueue('social-posts') private readonly queue: Queue,
  ) {}

  // ---------- Posts ----------

  listPosts(limit = 50) {
    return this.prisma.socialPost.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });
  }

  /** Crea uno o varios posts (uno por plataforma). Publica ya o programa. */
  async createPost(dto: {
    platforms: SocialPlatform[];
    caption: string;
    imageUrl?: string;
    linkUrl?: string;
    baseProductId?: string;
    scheduledFor?: string;
  }) {
    const platforms = dto.platforms?.length ? dto.platforms : (['FACEBOOK'] as SocialPlatform[]);
    const scheduledFor = dto.scheduledFor ? new Date(dto.scheduledFor) : null;
    const status: PostStatus = scheduledFor && scheduledFor.getTime() > Date.now() ? 'SCHEDULED' : 'PUBLISHING';

    const created = [];
    for (const platform of platforms) {
      const post = await this.prisma.socialPost.create({
        data: {
          platform,
          status,
          caption: dto.caption,
          imageUrl: dto.imageUrl || null,
          linkUrl: dto.linkUrl || null,
          baseProductId: dto.baseProductId || null,
          origin: 'MANUAL',
          scheduledFor,
        },
      });
      created.push(post);
      if (status === 'SCHEDULED') {
        const delay = scheduledFor!.getTime() - Date.now();
        await this.queue.add('publish', { postId: post.id }, { delay });
      } else {
        await this.queue.add('publish', { postId: post.id });
      }
    }
    return created;
  }

  async publishNow(id: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Publicación no encontrada');
    await this.prisma.socialPost.update({ where: { id }, data: { status: 'PUBLISHING', error: null } });
    await this.queue.add('publish', { postId: id });
    return { queued: true };
  }

  async deletePost(id: string) {
    await this.prisma.socialPost.delete({ where: { id } });
    return { deleted: true };
  }

  /** Ejecuta la publicación real (lo llama el processor). */
  async doPublish(postId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || post.status === 'PUBLISHED') return;

    const result = await this.publisher.publish(post.platform, {
      caption: post.caption,
      imageUrl: post.imageUrl,
      linkUrl: post.linkUrl,
    });

    await this.prisma.socialPost.update({
      where: { id: postId },
      data: result.success
        ? { status: 'PUBLISHED', publishedAt: new Date(), externalId: result.externalId, error: null }
        : { status: 'FAILED', error: result.error },
    });
  }

  // ---------- Piloto automático ----------

  async getAutopilot(): Promise<AutopilotConfig> {
    const raw = await this.redis.get(AUTOPILOT_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  }

  async setAutopilot(config: Partial<AutopilotConfig>): Promise<AutopilotConfig> {
    const merged = { ...(await this.getAutopilot()), ...config };
    merged.postsPerDay = Math.min(20, Math.max(1, Number(merged.postsPerDay) || 3));
    merged.postsPerHour = Math.min(12, Math.max(1, Number(merged.postsPerHour) || 1));
    await this.redis.set(AUTOPILOT_KEY, JSON.stringify(merged));
    return merged;
  }

  /** Estado del módulo: qué plataformas están listas para publicar. */
  async status() {
    const config = await this.getAutopilot();
    return {
      config,
      readiness: {
        FACEBOOK: this.publisher.isConfigured('FACEBOOK'),
        INSTAGRAM: this.publisher.isConfigured('INSTAGRAM'),
      },
      lastRun: await this.redis.get(LAST_RUN_KEY),
    };
  }

  /** Tick del piloto automático (lo llama el processor cada minuto). */
  async runAutopilotTick() {
    const config = await this.getAutopilot();
    if (!config.enabled) return;

    const now = new Date();
    const hour = now.getHours();
    const inHours =
      config.hourStart <= config.hourEnd
        ? hour >= config.hourStart && hour < config.hourEnd
        : hour >= config.hourStart || hour < config.hourEnd;
    if (!inHours) return;

    // ¿Pasó suficiente tiempo desde la última publicación?
    // Reparte las publicaciones del día dentro del horario activo.
    const spanHours = config.hourStart <= config.hourEnd
      ? config.hourEnd - config.hourStart
      : 24 - config.hourStart + config.hourEnd;
    const perDay = config.postsPerDay ?? 3;
    const intervalMs = Math.max(60_000, Math.floor((spanHours * 3_600_000) / perDay));
    const last = parseInt((await this.redis.get(LAST_RUN_KEY)) ?? '0', 10);
    if (Date.now() - last < intervalMs) return;

    // Sólo plataformas con token real
    const ready = config.platforms.filter((p) => this.publisher.isConfigured(p));
    if (!ready.length) return;

    const promo = await this.buildPromo(config.captionTemplates);
    if (!promo) return;

    await this.redis.set(LAST_RUN_KEY, String(Date.now()));

    for (const platform of ready) {
      // Instagram exige imagen
      if (platform === 'INSTAGRAM' && !promo.imageUrl) continue;
      const post = await this.prisma.socialPost.create({
        data: {
          platform,
          status: 'PUBLISHING',
          caption: promo.caption,
          imageUrl: promo.imageUrl,
          linkUrl: promo.linkUrl,
          baseProductId: promo.baseProductId,
          origin: 'AUTOPILOT',
        },
      });
      await this.queue.add('publish', { postId: post.id });
    }
  }

  /** Genera un borrador a partir de un producto (para el panel). */
  async generateFromProduct(productId: string) {
    const config = await this.getAutopilot();
    const promo = await this.buildPromo(config.captionTemplates, productId);
    if (!promo) throw new NotFoundException('Producto no disponible para promocionar');
    return promo;
  }

  /** Elige un producto activo (rotando) y arma la promo. */
  private async buildPromo(templates: string[], productId?: string) {
    const where = productId ? { id: productId, isActive: true } : { isActive: true };
    const products = await this.prisma.baseProduct.findMany({
      where,
      include: { pricingRules: { where: { isActive: true } } },
    });
    if (!products.length) return null;

    // Rotación para no repetir siempre el mismo
    let product = products[0];
    if (!productId && products.length > 1) {
      const idx = parseInt((await this.redis.get(ROTATION_KEY)) ?? '0', 10) % products.length;
      product = products[idx];
      await this.redis.set(ROTATION_KEY, String((idx + 1) % products.length));
    }

    const price = product.pricingRules.length
      ? Math.min(...product.pricingRules.map((r) => Number(r.unitPrice))).toFixed(2)
      : '—';
    const link = `${process.env.WEB_URL ?? 'http://localhost:3000'}/tienda/${product.id}`;
    const template = templates[Math.floor(Math.random() * templates.length)] ?? templates[0];
    const caption = template.replace(/{product}/g, product.name).replace(/{price}/g, price).replace(/{link}/g, link);

    return {
      caption,
      imageUrl: product.imageUrl ?? null,
      linkUrl: link,
      baseProductId: product.id,
    };
  }
}
