import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectQueue('incoming-messages') private readonly messageQueue: Queue,
  ) {}

  async enqueue(channel: string, payload: unknown): Promise<void> {
    await this.messageQueue.add('process-message', { channel, payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
    });
    this.logger.debug(`Mensaje encolado — canal: ${channel}`);
  }
}
