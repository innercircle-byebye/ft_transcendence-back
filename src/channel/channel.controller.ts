import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { UserDto } from 'src/user/dto/user.dto';
import { ChannelService } from './channel.service';
import { ChannelDto } from './dto/channel.dto';

@UseGuards(AuthGuard('jwt'))
@ApiTags('Channel')
@Controller('api/channel')
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  @ApiOperation({
    summary: '전체 채널 조회',
    description: '생성 되어 있는 전체 채널을 조회합니다.',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '전체 채널 목록',
  })
  @Get()
  getChannels() {
    return this.channelService.getAllChannels();
  }

  @ApiOperation({
    summary: '유저가 참여한 채널 조회',
    description: '현재 유저가 참여한 채널만 조회합니다.',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '내가 참여한 채널들의 목록',
  })
  @Get('/me')
  getChannelsByUser(@AuthUser() user: User) {
    return this.channelService.getAllChannelsByUser(user.userId);
  }

  @ApiOperation({
    summary: '채널 정보 확인',
    description: '파라미터로 전달된 채널의 정보를 확인 합니다',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '현재 선택한 채널의 정보',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Get('/:name')
  getChannelInfo(@Param('name') channelName: string) {
    return this.channelService.getChannelInformation(channelName);
  }

  @ApiOperation({
    summary: '채널 생성하기',
    description:
      '파라미터로 전달 되는 채널을 생성합니다. \n' +
      '채널 생성시 Body에 비밀번호, 최대 사용자 인원이 전달됩니다.\n' +
      '최대 사용자의 경우 필수이고, 비밀번호의 경우 필수가 아닙니다.',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '생성된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '채팅방 생성 인원은 최소 3명 이상, 최대 100명 이하입니다\n' +
      '이미 존재하는 채팅방 이름입니다.',
  })
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

  @ApiOperation({
    summary: '채널에 참여한 유저 조회',
    description: '참여한 전체 채널의 유저를 조회합니다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 전체 유저 목록',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Get('/:name/channelmembers')
  getChannelMembers(@Param('name') channelName: string) {
    return this.channelService.getChannelMembers(channelName);
  }

  @ApiOperation({
    summary: '채널 참여하기',
    description: '채팅방에 참여합니다',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 전체 유저 목록',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Post('/:name/join')
  joinChannel(
    @Param('name') channelName: string,
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
