import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { ChannelMember } from 'src/entities/ChannelMember';
import { Repository } from 'typeorm';
import { MuteEvent } from '../events/mute-created.event';

@Injectable()
export class MuteCreatedListener {
  constructor(
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    private muteEmitter: EventEmitter2,
  ) {}

  @OnEvent('removeMute')
  TempTempTemp(event: MuteEvent) {
    // handle and process "OrderCreatedEvent" event

    const executeTime = Date.parse(`${event.mutedDate}`) - Date.now();
    console.log(Date.parse(`${event.mutedDate}`) - Date.now());

    const clearMuteUser = this.channelMemberRepository.find({
      where: [{ channelId: event.channelId, userId: event.targetUserId }],
    });
    console.log(event);
    setTimeout(function () {
      console.log(clearMuteUser);
    }, executeTime);
  }

  @OnEvent('mute.create')
  handleMuteCreatedEvent(event: MuteEvent) {
    const executeTime = Date.parse(`${event.mutedDate}`) - Date.now();
    console.log(executeTime);
    console.log(event);
  }

  @OnEvent('mute.update')
  handleMuteUpdatedEvent(event: MuteEvent) {
    console.log(event);
  }
}
