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

  // - 내 친구 목록 조회하기
  // 요청: GET / api / friend / list
  // 응답: 친구인 user 목록

  // - 나한테 새로 들어온 친구 목록 조회하기
  // 요청: GET / api / friend / new
  // 응답 :  user 목록

  // - 내가 대기중인 친구 목록 조회하기
  // 요청: GET / api / friend / wait
  // 응답: user 목록

  // - 친구 요청하기
  // 요청: POST / api / friend / { respondent_id } / request(request body 없음)
  // 응답: 대상유저
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

  // - 친구 요청 취소하기
  // 요청: DELETE / api / friend / { respondent_id } / request_cancel
  // 응답: 대상유저
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

  // - 친구 요청 승인하기
  // 요청: PATCH / api / friend / { requester_id } / approve(request body 없음)
  // 응답: 대상유저
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

  // - 친구 요청 거절하기(내가 거절하면 상대방은 일주일동안 친구신청 다시 못한다.)
  // 요청: DELETE / api / friend / { requester_id } / reject
  // 응답: 대상유저
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

  // - 친구 관계 삭제하기
  // 요청: DELETE / api / friend / { user_id }
  // 응답: 대상유저
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
