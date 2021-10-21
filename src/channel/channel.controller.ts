import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { ChannelService } from './channel.service';

@ApiTags('Channel')
@Controller('api/channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @Get()
  getChannels() {
    return this.channelService.getAllChannels();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  getChannelsByUser(@AuthUser() user: User) {
    return this.channelService.getAllChannelsByUser(user.userId);
  }

  @Get('/:name')
  getChannelInfo(@Param('name') channelName) {
    return this.channelService.getChannelInformation(channelName);
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Get('/:name/channelmembers')
  getChannelMembers(@Param('name') channelName) {
    return this.channelService.getChannelMembers(channelName);
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Get('/:name/chat')
  getChannelChatsByChannelName(@Param('name') channelName) {
    console.log(channelName);
    return this.channelService.getChannelChatsByChannelName(channelName);
  }

  @UseGuards(AuthGuard('jwt'))
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
