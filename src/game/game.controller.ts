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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { GameMemberStatus } from 'src/entities/GameMember';
import { GameRoomCreateDto } from './dto/gameroom-create.dto';
import { GameRoomJoinDto } from './dto/gameroom-join.dto';
import { GameRoomListDto } from './dto/gameroom-list.dto';
import { GameRoomUpdateDto } from './dto/gameroom-update.dto';
import { GameService } from './game.service';
import { GameRoomDto } from './dto/gameroom.dto';
import { GameResultUserDto } from './dto/gameresult-user.dto';
import { GameResultWinRateDto } from './dto/gameresult-winrate.dto';
import { GameResultRankingDto } from './dto/gameresult-ranking.dto';

@UseGuards(JwtTwoFactorGuard)
@ApiTags('Game')
@Controller('api/game')
export class GameController {
  constructor(private gameService: GameService) {}

  @ApiOperation({
    summary: '전체 랭킹 조회 대상 유저 명수',
    description: '전체 랭킹 조회 대상 유저 명수를 조회합니다.\n\n',
  })
  @ApiOkResponse({
    type: Number,
    description: '전체 유저 명수',
  })
  @Get('/ranking/count')
  countAllUsers() {
    return this.gameService.getAllUserCount();
  }

  @ApiOperation({
    summary: '전체 유저 랭킹조회',
    description:
      '전체 유저의 랭킹을 조회합니다.\n\n개발단계라 승리 횟수(winCount) 기준으로 정렬하였습니다.' +
      'perPage(페이지당 보여줄 개수), page(원하는 페이지)값을 query로 받으며,\n\n' +
      'perPage, page가 하나라도 없거나 숫자값이 아니면,전체 게임방을 조회합니다.',
  })
  @ApiOkResponse({
    type: GameResultRankingDto,
    isArray: true,
  })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'page', required: false })
  @Get('/ranking')
  async getUserRanking(
    @Query('perPage') perPage: number,
    @Query('page') page: number,
  ) {
    if (!perPage || !page) return this.gameService.getAllUserRanking();
    return this.gameService.getUserRaningWithPaging(perPage, page);
  }

  @ApiOperation({
    summary: '전체 게임 방 조회',
    description:
      '생성 되어 있는 전체 게임 방을 조회합니다.\n\n' +
      'perPage(페이지당 보여줄 개수), page(원하는 페이지)값을 query로 받으며,\n\n' +
      'perPage, page가 하나라도 없거나 숫자값이 아니면, 전체 게임방을 조회합니다.',
  })
  @ApiOkResponse({
    type: GameRoomListDto,
    isArray: true,
    description: '전체 게임 방 목록',
  })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'page', required: false })
  @Get('/room/list')
  getGameRooms(@Query('perPage') perPage: number, @Query('page') page: number) {
    if (!perPage || !page) return this.gameService.getAllGameRooms();
    console.log(typeof perPage);
    return this.gameService.getAllGameRoomsWithPaging(perPage, page);
  }

  @ApiOperation({
    summary: '전체 게임 방 (개수)',
    description: '전체 게임 방의 개수를 조회합니다.\n\n',
  })
  @ApiOkResponse({
    type: Number,
    description: '전체 게임 방 갯수',
  })
  @Get('/room/list/count')
  countGameRooms() {
    return this.gameService.countGameRooms();
  }

  // GET /api/game/room/find_user/{user_id}
  @ApiOperation({
    summary: '유저가 참여한 게임방 조회',
    description: '유저가 참여하고 있는 게임방을 조회합니다.',
  })
  @ApiOkResponse({ type: GameRoomDto })
  @ApiBadRequestResponse({
    description: '유저가 게임중이 아닙니다.',
  })
  @Get('/room/find_user/:user_id')
  async findGameRoomByUserId(@Param('user_id') userId: number) {
    return this.gameService.findGameRoomByUserId(userId);
  }

  @ApiOperation({
    summary: '게임 방 정보 조회',
    description:
      '파라미터로 전달 된 게임 방 ID를 통한 게임 방의 정보를 조회합니다.\n\n',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '조회한 게임 방 ID의 정보',
  })
  @ApiBadRequestResponse({
    description: '게임방이 존재하지 않습니다.',
  })
  @Get('/room/:game_room_id')
  getGameRoomInfoById(@Param('game_room_id') gameRoomId: number) {
    return this.gameService.getGameRoomTotalInfo(gameRoomId);
  }

  @ApiOperation({
    summary: '게임 방 생성',
    description:
      '게임 방을 생성합니다. \n\n' +
      '게임 방 생성시 게임방 제목의 이름, 비밀번호, 최대 관전자 인원이 전달됩니다\n\n' +
      '비밀번호의 경우 필수적으로 전달 될 필요 없습니다.',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '생성 된 게임방의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '게임 참여 인원은 최소 2명 이상, 최대 8명 이하입니다.\n\n' +
      '게임 승리 점수는 최소 2점, 최대 10점 입니다.\n\n' +
      '이미 존재하는 게임방 이름입니다.',
  })
  @Post('/room')
  @ApiQuery({ name: 'invitedUserId', required: false })
  async createGameRoom(
    @Query('invitedUserId') invitedUserId: number | null,
    @AuthUser()
    user: User,
    @Body() body: GameRoomCreateDto,
  ) {
    return this.gameService.createGameRoom(user.userId, body, invitedUserId);
  }

  @ApiOperation({
    summary: '게임 방 정보 업데이트',
    description:
      '생성 되어 있는 게임 방의 정보를 업데이트 합니다.\n\n' +
      '정보 업데이트는 플레이어1 만 가능합니다.\n\n' +
      '(게임 방 이름, 비밀번호, 전체 관전자 수, 공속도, 승리 점수 변경 가능)',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '업데이트 된 게임 방의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '게임 참여 인원은 최소 2명 이상, 최대 8명 이하입니다.\n\n' +
      '게임 승리 점수는 최소 2점, 최대 10점 입니다.\n\n' +
      '이미 존재하는 게임방 이름입니다.\n\n' +
      '게임방 업데이트 권한이 없습니다.',
  })
  @Patch('/room/:game_room_id')
  async updateGameRoomInfo(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameRoomUpdateDto,
  ) {
    return this.gameService.updateGameRoom(gameRoomId, user.userId, body);
  }

  @ApiOperation({
    summary: '유저가 바로 참여할 수 있는 게임방 조회',
    description:
      '현재 게임에 참여할 수 있는 게임방 중 하나를 선택하여 전달합니다. \n\n' +
      '백엔드 내부에서 랜덤 선택하게 됩니다. \n\n' +
      '(비밀번호 방은 조회 되지 않습니댜)',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '선택된 게임 방의 정보',
  })
  @Get('/playable')
  async getPlayableGameRoom() {
    return this.gameService.getPlayableRooms();
  }

  @ApiOperation({
    summary: '유저가 바로 관전할 수 있는 게임방 조회',
    description:
      '현재 관전할 수 있는 게임방 중 하나를 선택하여 전달합니다. \n\n' +
      '백엔드 내부에서 랜덤 선택하게 됩니다.\n\n' +
      '(비밀번호 방은 조회 되지 않습니댜)',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '선택된 게임 방의 정보',
  })
  @Get('/observable')
  async getObsrvableGameRoom() {
    return this.gameService.getObservableRooms();
  }

  @ApiOperation({
    summary: '게임방 참여',
    description:
      '게임방에 참여합니다. \n\n body에 플레이어/관전자 정보와 첨여 방의 비밀번호를 전달하게 됩니다.',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '선택된 게임 방의 정보',
  })
  @ApiBadRequestResponse({
    description:
      '이미 다른 게임방에 참여중입니다.\n\n' +
      '게임방이 존재하지 않습니다.\n\n' +
      '비밀번호가 일치하지 않습니다.\n\n' +
      '게임방에 참여할 수 없습니다. (정원 초과)\n\n' +
      '게임방에 참여할 수 없습니다. (플레이어 만석)\n\n' +
      'ban 처리된 사용자 입니다.',
  })
  @Post('/room/:game_room_id/join')
  async joinGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameRoomJoinDto,
  ) {
    if (body.role === GameMemberStatus.PLAYER_TWO)
      return this.gameService.joinGameRoomAsPlayer(
        user.userId,
        gameRoomId,
        body.password,
      );

    return this.gameService.joinGameRoomAsObserver(
      user.userId,
      gameRoomId,
      body.password,
    );
  }

  @ApiOperation({
    summary: '게임방에서 특정 사용자를 강제퇴장 시킵니다.',
    description:
      '게임방에서 특정 사용자를 강제퇴장 시킵니다.(플레이어1만 할 수 있습니다.)',
  })
  @ApiResponse({
    status: 204,
    description: '강제퇴장 성공시 별도의 응답없음.',
  })
  @ApiBadRequestResponse({
    description:
      '본인을 강제퇴장시킬 수 없습니다.\n\n' +
      '게임방이 존재하지 않습니다.\n\n' +
      '해당 게임방에 참여 중이지 않습니다.\n\n' +
      '강제퇴장 권한이 없습니다.\n\n' +
      '플레이 중에는 강제퇴장 시킬 수 없습니다.\n\n' +
      '강제퇴장 대상이 게임방에 존재하지 않습니다.',
  })
  @Delete('/room/:game_room_id/kick/:target_user_id')
  async kickFromGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @Param('target_user_id') targetUserId: number,
    @AuthUser() user: User,
  ) {
    await this.gameService.kickFromGameRoom(
      gameRoomId,
      user.userId,
      targetUserId,
    );
  }

  @ApiOperation({
    summary: '게임방에서 플레이어로 이동',
    description: '게임방에서 관전자 -> 플레이어로 이동합니다.',
  })
  @ApiResponse({
    status: 204,
    description: '플레이어로 이동 성공시 별도의 응답없음.',
  })
  @ApiBadRequestResponse({
    description:
      '게임방이 존재하지 않습니다.\n\n' +
      '해당 게임방에 참여 중이지 않습니다.\n\n' +
      '이미 플레이어입니다.\n\n' +
      '이동 가능한 플레이어 자리가 없습니다.',
  })
  @Patch('/room/:game_room_id/move/player')
  async moveToPlayerInGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
  ) {
    await this.gameService.moveToPlayer(gameRoomId, user.userId);
  }

  @ApiOperation({
    summary: '게임방에서 관전자로 이동',
    description: '게임방에서 플레이어 -> 관전자로 이동합니다.',
  })
  @ApiResponse({
    status: 204,
    description: '관전자로 이동 성공시 별도의 응답없음.',
  })
  @ApiBadRequestResponse({
    description:
      '게임방이 존재하지 않습니다.\n\n' +
      '해당 게임방에 참여 중이지 않습니다.\n\n' +
      '이미 관전자입니다.\n\n' +
      '플레이 중에는 관전자로 이동할 수 없습니다.\n\n' +
      '혼자 있는 경우, 관전자로 이동할 수 없습니다.',
  })
  @Patch('/room/:game_room_id/move/observer')
  async moveToObserverInGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
  ) {
    await this.gameService.moveToObserver(gameRoomId, user.userId);
  }

  @ApiOperation({
    summary: '해당 유저의 게임 횟수',
    description: '조회 대상 유저의 게임 결과의 갯수를 전달합니다\n\n',
  })
  @ApiOkResponse({
    type: Number,
    description: '해당 유저의 게임 횟수',
  })
  @Get('/:user_id/results/count')
  countGameResultsByUserId(@Param('user_id') userId: number) {
    return this.gameService.countGameResultsOfUser(userId);
  }

  @ApiOperation({
    summary: '유저의 게임결과 조회하기',
    description:
      '파라미터로 전달되는 유저의 게임 결과 전체를 조회합니다.\n\n' +
      'perPage(페이지당 보여줄 개수), page(원하는 페이지), vsUserId(대전 상대 유저 ID번호), ballSpeed(경기 난이도)' +
      'date(경기 종료 시점)을 query로 받으며, 결과는 경기 종료 시점으로 정렬 되어있습니다. (lastModifiedAt)\n\n' +
      '현재 진행중인 게임의 결과는 제외합니다.',
  })
  @ApiOkResponse({
    type: GameResultUserDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description:
      '사용자 아이디와 상대 아이디가 동일합니다.\n\n' +
      '상대 사용자가 존재하지 않습니다.\n\n' +
      '유효하지 않은 게임 속도 값 입니다.',
  })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'vsUserId', required: false })
  @ApiQuery({ name: 'ballSpeed', required: false })
  @ApiQuery({ name: 'date', required: false })
  @Get('/:user_id/results')
  async getGameResultsByUserId(
    @Query('perPage') perPage: number,
    @Query('page') page: number,
    @Query('vsUserId') vsUserId: number,
    @Query('ballSpeed') ballSpeed: string,
    @Query('date') date: Date,
    @Param('user_id') userId: number,
  ) {
    // if (!perPage || !page) return this.gameService.getAllGameResults(userId);
    return this.gameService.getGameResultsPagenation(
      perPage,
      page,
      userId,
      vsUserId,
      ballSpeed,
      date,
    );
  }

  @ApiOperation({
    summary: '유저의 승률 조회하기',
    description:
      '파라미터로 전달되는 유저의 승률을 조회합니다.\n\n' +
      '현재 진행중인 게임의 결과는 제외합니다.',
  })
  @ApiOkResponse({
    type: GameResultWinRateDto,
    isArray: true,
  })
  @Get('/:user_id/win_rate')
  getWinRateByUserId(@Param('user_id') userId: number) {
    return this.gameService.getUserWinRate(userId);
  }
}
