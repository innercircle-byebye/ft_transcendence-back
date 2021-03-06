import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { UserDto } from 'src/user/dto/user.dto';
import { ChannelService } from './channel.service';
import { ChannelInfoDto } from './dto/channel-create.dto';
import { ChannelInviteDto } from './dto/channel-invite.dto';
import { ChannelJoinDto } from './dto/channel-join.dto';
import { ChannelUpdateDto } from './dto/channel-update.dto';
import { ChannelDto } from './dto/channel.dto';
import { ChannelChatCreateDto } from './dto/channelchat-create.dto';
import { ChannelChatDto } from './dto/channelchat.dto';
import { ChannelMemberAdminDto } from './dto/channelmember-admin.dto';
import { ChannelMemberUpdateDto } from './dto/channelmember-update.dto';
import { ChannelMemberDto } from './dto/channelmember.dto';

// TODO: createChannel 할 때 user id 배열 전달 동작(DM 구현 이후), updateChannelMember
@UseGuards(JwtTwoFactorGuard)
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
    description: '존재 하지 않는 채널입니다.\n\n 존재 하지 않는 유저입니다.',
  })
  @Get('/:name')
  getChannelInfo(@Param('name') channelName: string) {
    return this.channelService.getChannelInformation(channelName);
  }

  @ApiOperation({
    summary: '채널 생성하기',
    description:
      '파라미터로 전달 되는 채널을 생성합니다. \n\n' +
      '채널 생성시 Body에 비밀번호, 최대 유저 인원, 초대 할 유저의 id(번호)의 배열이 전달됩니다.\n\n' +
      '최대 유저의 경우 필수이고, 비밀번호와, 초대 할 유저의 배열의 경우 필수가 아닙니다.',
  })
  @ApiOkResponse({
    type: ChannelDto,
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
      body.updateName,
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
    type: ChannelMemberDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 전체 유저 목록',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Get('/:name/member')
  getChannelMembers(@Param('name') channelName: string) {
    return this.channelService.getChannelMembers(channelName);
  }

  @ApiOperation({
    summary: '채널 멤버 생성',
    description: '채널에 유저를 추가합니다.',
  })
  @ApiOkResponse({
    type: ChannelMemberDto,
    description: '파라미터로 전달된 채널의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 잘못된 비밀번호입니다.\n\n' +
      '존재하지 않는 유저입니다.\n\n 채널 정원 초과입니다.',
  })
  @Post('/:name/member')
  joinChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelJoinDto,
  ) {
    return this.channelService.createChannelMember(
      channelName,
      user.userId,
      body.targetUserId,
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
    description: '존재하지 않는 채널입니다.\n\n존재하지 않는 유저입니다.',
  })
  @Delete('/:name/member')
  leaveChannel(@Param('name') channelName: string, @AuthUser() user: User) {
    return this.channelService.deleteChannelMember(channelName, user.userId);
  }

  @ApiOperation({
    summary: '채널의 유저 업데이트 (채널 관리자만 사용 가능)',
    description:
      '채널의 유저의 상태를 변경합니다\n\n (mute 기한, ban 일시)\n\n' +
      '- mute의 경우, null을 전달 하게 되면 mute 상태가 해제됩니다.\n\n' +
      '- ban 처리 이후 유저는 현재 채널에서 삭제 처리됩니다.\n\n',
  })
  @ApiOkResponse({
    type: ChannelMemberDto,
    description: '채널 유저의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 유저 수정 권한이 없습니다.\n\n' +
      '존재 하지 않는 유저입니다. \n\n ban 당한 이용자압니다.',
  })
  @Patch('/:name/member')
  async updateChannelMember(
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
    );
  }

  @ApiOperation({
    summary: '채널에 사용자 초대',
    description:
      '채널에 사용자를 초대 합니다. (모든 유저 이용 가능, 초대 대상 유저들에게 DM 전송)\n\n' +
      '(한명의 사용자를 초대 하더라도 배열 형식의 데이터가 필요합니다) \n\n',
  })
  @ApiOkResponse({
    description: 'OK',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 존재하지 않는 사용자가 포함되어있습니다.',
  })
  @Post('/:name/invite')
  async initeUserToChannel(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelInviteDto,
  ) {
    return this.channelService.inviteUsersToChannel(
      channelName,
      user.userId,
      body.invitedUsers,
    );
  }

  @ApiOperation({
    summary: '채널의 관리자 등록 (채널 소유자;owner 만 사용 가능)',
    description: '채널의 관리자를 등록합니다\n\n',
  })
  @ApiOkResponse({
    type: ChannelMemberDto,
    description: '채널 유저의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '존재하지 않는 채널입니다.\n\n 유저 수정 권한이 없습니다.\n\n' +
      '잘못된 요청입니다.\n\n 존재하지 않는 유저입니다.',
  })
  @Patch('/:name/admin')
  setChannelMemberAnAdmin(
    @Param('name') channelName: string,
    @AuthUser() user: User,
    @Body() body: ChannelMemberAdminDto,
  ) {
    return this.channelService.setChannelMemberAnAdmin(
      channelName,
      user.userId,
      body.targetUserId,
      body.isAdmin,
    );
  }

  @ApiOperation({
    summary: '채널 채팅 조회',
    description:
      '주어진 채널의 전체 채팅을 조회합니다.\n\n' +
      'perPage(페이지당 보여줄 개수), page(원하는 페이지)값을 query로 받으며,\n\n' +
      'perPage, page가 하나라도 없거나 숫자값이 아니면, 전체 DM목록을 조회한다.',
  })
  @ApiOkResponse({
    type: ChannelChatDto,
    isArray: true,
    description: '파라미터로 전달된 채널의 전체 채팅 모음',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'page', required: false })
  @Get('/:name/chat')
  getChannelChatsByChannelName(
    @Param('name') channelName: string,
    @Query('perPage') perPage: number,
    @Query('page') page: number,
  ) {
    if (!perPage || !page)
      return this.channelService.getAllChannelChatsByName(channelName);
    return this.channelService.getChannelChatsWithPaging(
      channelName,
      perPage,
      page,
    );
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

  @ApiOperation({
    summary: '안읽은 채팅 개수 구하기',
    description:
      'after시간 이후로 해당 사용자로부터 새로 받은 채팅의 개수 (DM과 동일)\n\n' +
      'after은 1970년 1월 1일 00:00:00 UTC 이후 경과 시간 (밀리 초)을 나타내는 숫자로 ' +
      'Date객체에서 getTime()함수로 구한 값입니다.',
  })
  @ApiOkResponse({
    type: String,
    description: 'after시간 이후로 해당 사용자로부터 새로 받은 DM의 개수',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 채널입니다.',
  })
  @Get('/:name/unreads')
  async getChannelChatUnreads(
    @AuthUser() user: User,
    @Param('name') channelName: string,
    @Query('after') after: number,
  ) {
    return this.channelService.getChannelChatUnreadsCount(channelName, after);
  }

  @ApiOperation({
    summary: 'mute 해제 task 목록 조회',
    description: 'mute 해제 task 목록을 조회합니다. (조회 테스트용)',
  })
  @ApiOkResponse({
    isArray: true,
    description: 'mute 해제 목록',
  })
  @Get('/:name/mutetask')
  getMuteTasks() {
    return this.channelService.getTimeouts();
  }
}
