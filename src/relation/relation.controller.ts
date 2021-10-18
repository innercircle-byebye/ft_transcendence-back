import {
  Controller,
  Delete,
  Get,
  Param,
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
}
