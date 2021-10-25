import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { DM } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { DmService } from './dm.service';
import { DMContentDto } from './dto/dm-content.dto';

@ApiTags('DM')
@UseGuards(AuthGuard('jwt'))
@Controller('api/dm')
export class DmController {
  constructor(private dmService: DmService) {}

  //  - 특정 사용자와의 DM목록 가져오기
  // 요청: GET /api/dm/{userId}/chats
  // query: { perPage: 페이지당개수(number), page: 페이지번호(number) }
  // 응답: 200, DM 객체 목록(최신순으로)
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

  //  - 특정 사용자에게 DM 보내기
  // 요청: POST /api/dm/{userId}/chats
  // body: { content: string }
  // 응답: 201, 없음
  // dm 이벤트가 emit됨(DM객체 보내줌)
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
  @Post('/:userId/chats')
  async createDMChats(
    @AuthUser() user: User,
    @Param('userId') receiverId: number,
    @Body() { content }: DMContentDto,
  ) {
    this.dmService.createDMChats(user.userId, receiverId, content);
  }

  //  - 특정 사용자에게 이미지 보내기
  // 요청: POST /api/dm/{userId}/images
  // body: { image: multipart }
  // 응답: 201, 없음
  // dm 이벤트가 emit됨(DM객체 보내줌)
  @Post('/:userId/images')
  async createDMImages() {
    return 'hello';
  }

  //  - 특정 사용자가 보낸 dm중 안읽은 개수 구하기
  // 요청: GET /api/dm/{userId}/unreads
  // query: { after: 기준시간(timestemp) }
  // 응답: 200, 개수(number)
  @Get('/:userId/unreads')
  async getDMUnreads() {
    return 'hello';
  }
}
