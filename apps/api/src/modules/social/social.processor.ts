import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SocialService } from './social.service';

@Processor('social-posts')
export class SocialProcessor extends WorkerHost {
  private readonly logger = new Logger(SocialProcessor.name);

  constructor(private readonly social: SocialService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'autopilot-tick') {
      await this.social.runAutopilotTick();
      return;
    }
    if (job.name === 'publish') {
      await this.social.doPublish(job.data.postId);
      return;
    }
  }
}
