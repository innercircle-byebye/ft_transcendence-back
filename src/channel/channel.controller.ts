import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { ChannelInfoDto } from './dto/channel-create.dto';
import { ChannelUpdateDto } from './dto/channel-update.dto';
import { ChannelDto } from './dto/channel.dto';
import { ChannelChatCreateDto } from './dto/channelchat-create.dto';
import { ChannelChatDto } from './dto/channelchat.dto';
import { ChannelMemberUpdateDto } from './dto/channelmember-update.dto';
import { ChannelMemberDto } from './dto/channelmember.dto';

// TODO: createChannel 할 때 user id 배열 전달 동작(DM 구현 이후), updateChannelMember
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
    description: '존재 하지 않는 채널입니다.\n\n 존재 하지 않는 사용자입니다.',
  })
  @Get('/:name')
  getChannelInfo(@Param('name') channelName: string) {
    return this.channelService.getChannelInformation(channelName);
  }

  @ApiOperation({
    summary: '채널 생성하기',
    description:
      '파라미터로 전달 되는 채널을 생성합니다. \n\n' +
      '채널 생성시 Body에 비밀번호, 최대 사용자 인원, 초대 할 사용자의 id(번호)의 배열이 전달됩니다.\n\n' +
      '최대 사용자의 경우 필수이고, 비밀번호와, 초대 할 사용자의 배열의 경우 필수가 아닙니다.',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '생성된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '채널 생성 인원은 최소 3명 이상, 최대 100명 이하입니다\n\n' +
      '이미 존재하는 채널 이름입니다.',
  })
  @Post('/:name')
  createChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelInfoDto,
  ) {
    return this.channelService.createChannel(
      channelName,
      user.userId,
      body.password,
      body.maxParticipantNum,
      body.invitedUsers,
    );
  }

  @ApiOperation({
    summary: '채널 정보 업데이트',
    description:
      '생성 되어 있는 채널의 정보를 업데이트 합니다.\n\n' +
      '(채널 이름, 비밀번호, 전체 참여자 수 변경 가능)',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '업데이트 된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재 하지 않는 채널입니다.\n\n' +
      '채널 생성 인원은 최소 3명 이상, 최대 100명 이하입니다\n\n' +
      '이미 존재하는 채널 이름입니다.\n\n' +
      '채널 수정 권한이 없습니다.\n\n',
  })
  @Patch('/:name')
  updateChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelUpdateDto,
  ) {
    return this.channelService.updateChannel(
      channelName,
      user.userId,
      body.name,
      body.password,
      body.maxParticipantNum,
    );
  }

  @ApiOperation({
    summary: '채널 삭제',
    description: '채널을 삭제합니다.\n\n (채널 소유자만 가능)',
  })
  @ApiOkResponse({
    type: ChannelDto,
    isArray: true,
    description: '삭제된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description: '존재 하지 않는 채널입니다.\n\n 채널 삭제 권한이 없습니다.',
  })
  @Delete('/:name')
  async deleteChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
  ) {
    return this.channelService.deleteChannel(channelName, user.userId);
  }

  @ApiOperation({
    summary: '채널에 참여한 유저 조회',
    description: '참여한 채널의 전체 유저를 조회합니다.',
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
    summary: '채널 멤버 생성',
    description: '채널에 유저를 추가합니다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 잘못된 비밀번호입니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n 채널 정원 초과입니다.',
  })
  @Post('/:name/member')
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

  @ApiOperation({
    summary: '채널에서 유저 삭제',
    description: '채널에서 유저를 삭제합니다',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 잘못된 비밀번호입니다.\n\n' +
      '존재하지 않는 사용자입니다.',
  })
  @Delete('/:name/member')
  leaveChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body,
  ) {
    return this.channelService.deleteChannelMember(
      channelName,
      user.userId,
      body.targetUserId,
    );
  }

  @ApiOperation({
    summary: '채널에서 유저 업데이트',
    description:
      '채널에서 유저의 상태를 변경합니다\n\n (mute 기한, ban 일시, 관리자 권한 유무)\n\n' +
      '- mute의 경우, null을 전달 하게 되면 mute 상태가 해제됩니다.\n\n' +
      '- ban 처리 이후 사용자는 현재 채널에서 삭제 처리됩니다.\n\n',
  })
  @ApiOkResponse({
    type: ChannelMemberDto,
    description: '채널 사용자의 정보',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Patch('/:name/member')
  updateChannelMember(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelMemberUpdateDto,
  ) {
    return this.channelService.updateChannelMember(
      channelName,
      user.userId,
      body.targetUserId,
      body.banDate,
      body.mutedDate,
      body.isAdmin,
    );
  }

  @ApiOperation({
    summary: '채널 채팅 조회',
    description: '주어진 채널의 전체 채팅을 조회합니다.',
  })
  @ApiOkResponse({
    type: ChannelChatDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 전체 채팅 모음',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Get('/:name/chat')
  getChannelChatsByChannelName(@Param('name') channelName: string) {
    return this.channelService.getChannelChatsByChannelName(channelName);
  }

  @ApiOperation({
    summary: '채널 채팅 생성',
    description:
      '해당 채널에 채팅을 생성합니다.\n\n 채팅 생성 후 연결 된 방으로 websocket서버로 채팅 내용을 전송합니다.',
  })
  @ApiOkResponse({
    type: ChannelChatDto,
    description: '파라미터로 전달된 채널의 채팅',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Post('/:name/chat')
  createChannelChat(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelChatCreateDto,
  ) {
    return this.channelService.createChannelChat(
      channelName,
      body.content,
      user.userId,
    );
  }
}
