import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChannelService } from './channel.service';

@ApiTags('Channel')
@Controller('api/channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Post('/:name')
  createChannel(@Param('name') channelName, @Body() body) {
    return this.channelService.createChannel(
      channelName,
      body.ownerId,
      body.password,
      body.maxParticipantNum,
    );
  }
}
