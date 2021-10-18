import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { ChannelService } from './channel.service';

@UseGuards(AuthGuard('jwt'))
@ApiTags('Channel')
@Controller('api/channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Post('/:name')
  createChannel(
    @Param('name') channelName,
    @AuthUser() user: User,
    @Body() body,
  ) {
    return this.channelService.createChannel(
      channelName,
      user.userId,
      body.password,
      body.maxParticipantNum,
    );
  }

  @Get('/:name/channelmembers')
  getChannelMembers(@Param('name') channelName) {
    return this.channelService.getChannelMembers(channelName);
  }

  @Post('/:name/join')
  joinChannel(@Param('name') channelName, @Body() body) {
    return this.channelService.createChannelMember(
      channelName,
      body.userId,
      body.password,
    );
  }

  @Post('/:name/chat')
  createChannelChat(@Param('name') channelName, @Body() body) {
    return this.channelService.createChannelChat(
      channelName,
      body.content,
      body.userId,
    );
  }
}
