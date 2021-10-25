import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmController } from './dm.controller';

@Module({
  providers: [DmService],
  controllers: [DmController],
})
export class DmModule {}
