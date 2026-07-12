import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export interface BotState {
  currentFlow: string | null;
  currentStep: string | null;
  context: Record<string, unknown>;
}

const SESSION_TTL = 60 * 60 * 2;

@Injectable()
export class BotSessionService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  private key(id: string) { return `bot:session:${id}`; }

  async get(conversationId: string): Promise<BotState | null> {
    const raw = await this.redis.get(this.key(conversationId));
    return raw ? JSON.parse(raw) : null;
  }

  async set(conversationId: string, state: Partial<BotState>): Promise<void> {
    const current = (await this.get(conversationId)) ?? {
      currentFlow: null, currentStep: null, context: {},
    };
    const merged: BotState = {
      ...current,
      ...state,
      context: { ...current.context, ...(state.context ?? {}) },
    };
    await this.redis.setex(this.key(conversationId), SESSION_TTL, JSON.stringify(merged));
  }

  async clear(conversationId: string): Promise<void> {
    await this.redis.del(this.key(conversationId));
  }

  async patchContext(conversationId: string, patch: Record<string, unknown>): Promise<void> {
    await this.set(conversationId, { context: patch });
  }
}
