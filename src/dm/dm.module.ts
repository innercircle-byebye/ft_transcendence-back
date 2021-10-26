import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DM } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { EventsModule } from 'src/events/events.module';
import { DmController } from './dm.controller';
import { DmService } from './dm.service';

@Module({
  imports: [TypeOrmModule.forFeature([DM, User]), EventsModule],
  providers: [DmService],
  controllers: [DmController],
})
export class DmModule {}
