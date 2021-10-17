import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
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
}
