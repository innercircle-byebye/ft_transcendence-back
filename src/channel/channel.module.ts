import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { User } from 'src/entities/User';
import { ChannelChat } from 'src/entities/ChannelChat';
import { ChannelMember } from 'src/entities/ChannelMember';
import { EventsModule } from 'src/events/events.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { MuteCreatedListener } from './listeners/mute-created.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Channel, ChannelChat, ChannelMember]),
    EventsModule,
  ],
  providers: [ChannelService, MuteCreatedListener],
  controllers: [ChannelController],
})
export class ChannelModule {}
