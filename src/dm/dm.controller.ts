import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { DM, DMType } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { DmService } from './dm.service';
import { DMContentDto } from './dto/dm-content.dto';

@ApiTags('DM')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtTwoFactorGuard)
@Controller('api/dm')
export class DmController {
  constructor(private dmService: DmService) {}

  @ApiOperation({
    summary: 'DM 목록 조회하기',
    description:
      '특정 상대와의 DM 목록을 조회한다.\n\n' +
      'perPage(페이지당 보여줄 개수), page(원하는 페이지)값을 query로 받으며,\n\n' +
      'perPage, page가 하나라도 없거나 숫자값이 아니면, 전체 DM목록을 조회한다.',
  })
  @ApiOkResponse({
    type: DM,
    isArray: true,
    description: 'DM 목록',
  })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'page', required: false })
  @Get('/:userId/chats')
  async getDMChats(
    @AuthUser() user: User,
    @Param('userId') opponentId: number,
    @Query('perPage') perPage: number,
    @Query('page') page: number,
  ) {
    if (!perPage || !page) {
      return this.dmService.getAllDMChats(user.userId, opponentId);
    }
    return this.dmService.getDMChats(user.userId, opponentId, perPage, page);
  }

  @ApiOperation({
    summary: 'DM 보내기',
    description:
      '특정 사용자에게 DM을 보낸다.\n\n' +
      "'dm'이벤트가 emit되고 sender, receiver 정보를 포함한 DM객체를 보내준다.\n\n" +
      'content는 비어있으면 안됨.',
  })
  @ApiResponse({
    status: 201,
    description:
      "별도 응답은 없음. ('dm'이벤트가 emit되고 sender, receiver 정보를 포함한 DM객체를 보내준다.)",
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 사용자입니다.',
  })
  @Post('/:userId/chats')
  async createDMChats(
    @AuthUser() user: User,
    @Param('userId') receiverId: number,
    @Body() { content }: DMContentDto,
  ) {
    await this.dmService.createDM(
      user.userId,
      receiverId,
      content,
      DMType.PLAIN,
    );
  }

  @ApiOperation({
    summary: '안읽은 DM 개수 구하기',
    description:
      'after시간 이후로 해당 사용자로부터 새로 받은 DM의 개수\n\n' +
      'after은 1970년 1월 1일 00:00:00 UTC 이후 경과 시간 (밀리 초)을 나타내는 숫자로 ' +
      'Date객체에서 getTime()함수로 구한 값입니다.',
  })
  @ApiOkResponse({
    type: Number,
    description: 'after시간 이후로 해당 사용자로부터 새로 받은 DM의 개수',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 사용자입니다.',
  })
  @Get('/:userId/unreads')
  async getDMUnreads(
    @AuthUser() user: User,
    @Param('userId') senderId: number,
    @Query('after') after: number,
  ) {
    return this.dmService.getDMUnreadsCount(user.userId, senderId, after);
  }

  @ApiOperation({
    summary: 'DM 주고받았던 사용자 목록 조회',
    description:
      'DM 주고받았던 사용자 목록 조회한다.\n\n' +
      '가장 최근에 DM 주고받았던 사용자부터 담겨있다.',
  })
  @ApiOkResponse({
    type: User,
    isArray: true,
    description: '사용자 목록',
  })
  @Get('/users')
  async getDMUsers(@AuthUser() user: User) {
    return this.dmService.getAllDMUsers(user.userId);
  }
}
