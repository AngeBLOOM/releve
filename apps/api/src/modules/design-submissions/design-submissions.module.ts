import { Module } from '@nestjs/common';
import { DesignSubmissionsController } from './design-submissions.controller';
import { DesignSubmissionsService } from './design-submissions.service';

@Module({
  controllers: [DesignSubmissionsController],
  providers: [DesignSubmissionsService],
})
export class DesignSubmissionsModule {}
