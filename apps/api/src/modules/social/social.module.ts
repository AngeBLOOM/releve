import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialPublisherService } from './social-publisher.service';
import { SocialProcessor } from './social.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'social-posts' })],
  controllers: [SocialController],
  providers: [SocialService, SocialPublisherService, SocialProcessor],
})
export class SocialModule implements OnModuleInit {
  private readonly logger = new Logger(SocialModule.name);

  constructor(@InjectQueue('social-posts') private readonly queue: Queue) {}

  /** Programa el tick del piloto automático cada minuto (idempotente). */
  async onModuleInit() {
    await this.queue.add(
      'autopilot-tick',
      {},
      {
        repeat: { every: 60_000 },
        jobId: 'autopilot-tick',
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    this.logger.log('Piloto automático de redes sociales programado (cada 60s)');
  }
}
