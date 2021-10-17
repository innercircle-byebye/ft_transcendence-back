import {
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RelationService } from './relation.service';

@UseGuards(AuthGuard('jwt'))
@Controller('api')
export class RelationController {
  constructor(private relationService: RelationService) {}

  @Post('block/:block_user_id')
  async blockUser(@Req() req, @Param('block_user_id') blockUserId: number) {
    const { user } = req;

    const blockedUser = await this.relationService.blockUser(
      user.userId,
      blockUserId,
    );

    return {
      success: true,
      code: 201,
      data: {
        blockedUser,
      },
    };
  }

  @Delete('block/:unblock_user_id')
  async unblockUser(
    @Req() req,
    @Param('unblock_user_id') unblockUserId: number,
  ) {
    const { user } = req;

    const unblockedUser = await this.relationService.unblockUser(
      user.userId,
      unblockUserId,
    );

    return {
      success: true,
      code: 200,
      data: {
        unblockedUser,
      },
    };
  }
}
