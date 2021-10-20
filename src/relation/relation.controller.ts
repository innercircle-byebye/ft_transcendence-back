import {
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { UserDto } from 'src/user/dto/user.dto';
import { RelationService } from './relation.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api')
export class RelationController {
  constructor(private relationService: RelationService) {}

  @ApiTags('Block')
  @ApiOperation({
    summary: '차단목록 조회',
    description: '내가 차단한 사용자들의 목록을 조회한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '내가 차단한 사용자들의 목록',
  })
  @Get('/block/list')
  async getBlockedUserList(@AuthUser() user: User) {
    const blockedUserList = await this.relationService.getBlockedUserList(
      user.userId,
    );
    return blockedUserList;
  }

  @ApiTags('Block')
  @ApiOperation({
    summary: '차단하기',
    description: '특정 사용자를 나한테 차단한다.',
  })
  @ApiResponse({
    status: 201,
    type: UserDto,
    description: '차단된 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '본인을 차단할 수 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '이미 차단된 회원입니다.',
  })
  @Post('block/:block_user_id')
  async blockUser(
    @AuthUser() user: User,
    @Param('block_user_id') blockUserId: number,
  ) {
    const blockedUser = await this.relationService.blockUser(
      user.userId,
      blockUserId,
    );
    return blockedUser;
  }

  @ApiTags('Block')
  @ApiOperation({
    summary: '차단 해제하기',
    description: '내가 차단한 사용자를 차단 해제한다.',
  })
  @ApiOkResponse({ type: UserDto, description: '차단 해제된 사용자 정보' })
  @ApiBadRequestResponse({
    description:
      '본인을 차단할 수도, 차단 해제할 수도 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '차단된 기록이 없습니다.',
  })
  @Delete('block/:unblock_user_id')
  async unblockUser(
    @AuthUser() user: User,
    @Param('unblock_user_id') unblockUserId: number,
  ) {
    const unblockedUser = await this.relationService.unblockUser(
      user.userId,
      unblockUserId,
    );
    return unblockedUser;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구목록 조회',
    description: '나와 친구관계인 사용자들의 목록을 조회한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '나와 친구인 사용자들의 목록',
  })
  @Get('friend/list')
  async getFriendUserList(@AuthUser() user: User) {
    const friendUserList = await this.relationService.getFriendUserList(
      user.userId,
    );
    return friendUserList;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구요청목록 조회',
    description: '나에게 친구관계를 요청한 사용자들의 목록을 조회한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '나에게 친구요청한 사용자들의 목록',
  })
  @Get('friend/new')
  async getNewFriendRequestUserList(@AuthUser() user: User) {
    const newFriendRequestUserList =
      await this.relationService.getNewFriendRequestUserList(user.userId);
    return newFriendRequestUserList;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구대기목록 조회',
    description: '내가 친구관계를 요청한 사용자들의 목록을 조회한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
    description: '내가 친구요청한 사용자들의 목록',
  })
  @Get('friend/wait')
  async getWaitFriendRequestUserList(@AuthUser() user: User) {
    const waitFriendRequestUserList =
      await this.relationService.getWaitFriendRequestUserList(user.userId);
    return waitFriendRequestUserList;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구 요청하기',
    description: '특정 사용자에게 친구관계를 요청한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    description: '내가 친구요청한 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '본인에게 친구 요청할 수 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '이미 친구관계 입니다.\n\n' +
      '현재 친구 요청 대기 중입니다.\n\n' +
      '해당 사용자로부터 들어온 친구 요청이 존재합니다.\n\n' +
      '친구 요청이 거절된 기록이 있습니다. ? 일 ? 시간 ? 분 ? 초 뒤에 친구 요청이 가능합니다.',
  })
  @Post('friend/:respondent_id/request')
  async requestFriendRelation(
    @AuthUser() user: User,
    @Param('respondent_id') respondentId: number,
  ) {
    const respondentUser = await this.relationService.requestFriendRelation(
      user,
      respondentId,
    );
    return respondentUser;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구 요청 취소하기',
    description: '대기중인 친구요청을 취소한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    description: '내가 친구요청했던 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '본인에게 친구 요청할 수도 요청 취소할 수도 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '취소할 친구 요청이 없습니다.',
  })
  @Delete('friend/:respondent_id/request_cancel')
  async cancelFriendRequest(
    @AuthUser() user: User,
    @Param('respondent_id') respondentId: number,
  ) {
    const respondentUser = await this.relationService.cancelFriendRequest(
      user,
      respondentId,
    );
    return respondentUser;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구 요청 승인하기',
    description: '나에게 들어온 친구요청을 승인한다.(친구가 된다.)',
  })
  @ApiOkResponse({
    type: UserDto,
    description: '나에게 친구요청한 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '본인에게 친구요청 승인을 할 수 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '승인할 친구 요청이 없습니다.',
  })
  @Patch('friend/:requester_id/approve')
  async approveFriendRequest(
    @AuthUser() user: User,
    @Param('requester_id') requesterId: number,
  ) {
    const requesterUser = await this.relationService.approveFriendRequest(
      user,
      requesterId,
    );
    return requesterUser;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구 요청 거절하기',
    description: '나에게 들어온 친구요청을 거절한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    description: '나에게 친구요청한 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '본인에게 친구 요청받을 수도, 거절할 수도 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '거절할 친구 요청이 없습니다.',
  })
  @Delete('friend/:requester_id/reject')
  async rejectFriendRequest(
    @AuthUser() user: User,
    @Param('requester_id') requesterId: number,
  ) {
    const requesterUser = await this.relationService.rejectFriendRequest(
      user,
      requesterId,
    );
    return requesterUser;
  }

  @ApiTags('Friend')
  @ApiOperation({
    summary: '친구 관계 삭제하기',
    description: '친구 관계를 삭제한다.',
  })
  @ApiOkResponse({
    type: UserDto,
    description: '나와 친구관계였던 사용자 정보',
  })
  @ApiBadRequestResponse({
    description:
      '혼자 친구관계를 만들 수도 삭제할 수도 없습니다.\n\n' +
      '존재하지 않는 사용자입니다.\n\n' +
      '삭제할 친구 관계가 없습니다.',
  })
  @Delete('friend/:user_id')
  async deleteFriend(
    @AuthUser() user: User,
    @Param('user_id') targetUserId: number,
  ) {
    const targetUser = await this.relationService.deleteFriend(
      user,
      targetUserId,
    );
    return targetUser;
  }
}
