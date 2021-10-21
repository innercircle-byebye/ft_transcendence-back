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

  @Get()
  getChannels() {
    return this.channelService.getAllChannels();
  }

  @Get('/me')
  getChannelsByUser(@AuthUser() user: User) {
    return this.channelService.getAllChannelsByUser(user.userId);
  }

  @Get('/:name')
  getChannelInfo(@Param('name') channelName) {
    return this.channelService.getChannelInformation(channelName);
  }

  @Post('/:name')
  createChannel(
    @Param('name') channelName,
    @AuthUser() user: User,
    @Body() body,
  ) {
    console.log(user);
    console.log(body);
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
  joinChannel(
    @Param('name') channelName,
    @AuthUser() user: User,
    @Body() body,
  ) {
    return this.channelService.createChannelMember(
      channelName,
      user.userId,
      body.password,
    );
  }

  @Get('/:name/chat')
  getChannelChatsByChannelName(@Param('name') channelName) {
    console.log(channelName);
    return this.channelService.getChannelChatsByChannelName(channelName);
  }

  @Post('/:name/chat')
  createChannelChat(
    @Param('name') channelName,
    @AuthUser() user: User,
    @Body() body,
  ) {
    return this.channelService.createChannelChat(
      channelName,
      body.content,
      user.userId,
    );
  }
}
