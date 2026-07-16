import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SocialPlatform } from '@prisma/client';

export interface PublishInput {
  caption: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}
export interface PublishResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

const GRAPH = 'https://graph.facebook.com/v19.0';

/** Detecta tokens que siguen siendo placeholders. */
function isReal(token?: string): boolean {
  return !!token && token.length > 10 && !/reemplazar|placeholder|your_|tu_|xxxx/i.test(token);
}

@Injectable()
export class SocialPublisherService {
  private readonly logger = new Logger(SocialPublisherService.name);

  /** ¿Está configurada esta plataforma para publicar de verdad? */
  isConfigured(platform: SocialPlatform): boolean {
    if (platform === 'FACEBOOK') {
      return isReal(process.env.MESSENGER_PAGE_ACCESS_TOKEN) && !!process.env.FACEBOOK_PAGE_ID;
    }
    return isReal(process.env.INSTAGRAM_ACCESS_TOKEN) && !!process.env.INSTAGRAM_PAGE_ID;
  }

  async publish(platform: SocialPlatform, input: PublishInput): Promise<PublishResult> {
    if (!this.isConfigured(platform)) {
      return { success: false, error: `Token de ${platform} no configurado todavía` };
    }
    try {
      return platform === 'FACEBOOK'
        ? await this.publishFacebook(input)
        : await this.publishInstagram(input);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? err.message;
      this.logger.error(`Error publicando en ${platform}: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Facebook exige un token de PÁGINA para publicar. Si tenemos un token de
   * usuario del sistema (con pages_show_list), pedimos el token de la página.
   */
  private async getPageToken(pageId: string, token: string): Promise<string> {
    try {
      const res = await axios.get(`${GRAPH}/${pageId}`, {
        params: { fields: 'access_token', access_token: token },
      });
      return res.data?.access_token || token;
    } catch {
      return token;
    }
  }

  private async publishFacebook(input: PublishInput): Promise<PublishResult> {
    const pageId = process.env.FACEBOOK_PAGE_ID!;
    const token = await this.getPageToken(pageId, process.env.MESSENGER_PAGE_ACCESS_TOKEN!);
    const message = input.linkUrl ? `${input.caption}\n\n${input.linkUrl}` : input.caption;

    if (input.imageUrl) {
      const res = await axios.post(`${GRAPH}/${pageId}/photos`, null, {
        params: { url: input.imageUrl, caption: message, access_token: token },
      });
      return { success: true, externalId: res.data.post_id ?? res.data.id };
    }
    const res = await axios.post(`${GRAPH}/${pageId}/feed`, null, {
      params: { message, link: input.linkUrl || undefined, access_token: token },
    });
    return { success: true, externalId: res.data.id };
  }

  private async publishInstagram(input: PublishInput): Promise<PublishResult> {
    const igId = process.env.INSTAGRAM_PAGE_ID!;
    const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
    if (!input.imageUrl) {
      return { success: false, error: 'Instagram requiere una imagen para publicar' };
    }
    const caption = input.linkUrl ? `${input.caption}\n\n🔗 ${input.linkUrl}` : input.caption;

    // 1) Crear contenedor de medios
    const container = await axios.post(`${GRAPH}/${igId}/media`, null, {
      params: { image_url: input.imageUrl, caption, access_token: token },
    });
    // 2) Publicar el contenedor
    const published = await axios.post(`${GRAPH}/${igId}/media_publish`, null, {
      params: { creation_id: container.data.id, access_token: token },
    });
    return { success: true, externalId: published.data.id };
  }
}
