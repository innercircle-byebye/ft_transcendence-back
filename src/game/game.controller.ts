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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { GameRoomCreateDto } from './dto/gameroom-create.dto';
import { GameRoomJoinDto } from './dto/gameroom-join.dto';
import { GameRoomListDto } from './dto/gameroom-list.dto';
import { GameRoomUpdateDto } from './dto/gameroom-update.dto';
import { GameMemberBanDto } from './dto/gamemember-ban.dto';
import { GameRoomDto } from './dto/gameroom.dto';
import { GameService } from './game.service';
import { GameMemberMoveDto } from './dto/gamemember-move.dto';

@UseGuards(JwtTwoFactorGuard)
@ApiTags('Game')
@Controller('api/game')
export class GameController {
  constructor(private gameService: GameService) {}

  @ApiOperation({
    summary: '전체 게임 방 조회',
    description: '생성 되어 있는 전체 게임 방을 조회합니다.\n\n',
  })
  @ApiOkResponse({
    type: GameRoomListDto,
    isArray: true,
    description: '전체 게임 방 목록',
  })
  @Get('/room/list')
  getGameRooms() {
    return this.gameService.getAllGameRooms();
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
  @Get('/room/:game_room_id')
  getGameRoomInfoById(@Param('game_room_id') gameRoomId) {
    console.log(gameRoomId);
    return 'OK';
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
  @Post('/room')
  createGameRoom(@AuthUser() user: User, @Body() body: GameRoomCreateDto) {
    console.log(body);
    return 'OK';
  }

  @ApiOperation({
    summary: '게임 방 정보 업데이트',
    description:
      '생성 되어 있는 게임 방의 정보를 업데이트 합니다.\n\n' +
      '정보 업데이트는 플레이어1 만 가능합니다.\n\n' +
      '(게임 방 이름, 비밀번호, 전체 관전자 수, 공속도 변경 가능)',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '업데이트 된 게임 방의 정보',
  })
  @Patch('/room/:game_room_id')
  updateGameRoomInfo(
    @Param('game_room_id') gameRoomId,
    @AuthUser() user: User,
    @Body() body: GameRoomUpdateDto,
  ) {
    console.log(gameRoomId);
    console.log(user.userId);
    console.log(body);
    return 'OK';
  }

  @ApiOperation({
    summary: '유저가 바로 참여할 수 있는 게임방 조회',
    description:
      '현재 게임에 참여할 수 있는 게임방 중 하나를 선택하여 전달합니다. \n\n' +
      '백엔드 내부에서 랜덤 선택하게 됩니다.',
  })
  @ApiOkResponse({
    type: GameRoomDto,
    description: '선택된 게임 방의 정보',
  })
  @Get('/room/playable')
  getPlayableGameRoom() {
    return 'OK';
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
  @Post('/room/:game_room_id/join')
  joinGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameRoomJoinDto,
  ) {
    console.log(gameRoomId, user.userId, body);
    return 'OK';
  }

  @ApiOperation({
    summary: '게임방 나가기',
    description:
      '게임방에서 나갑니다. \n\n body에 플레이어/관전자 정보를 전달 받게됩니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  @Delete('/room/:game_room_id/leave')
  leaveGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameRoomJoinDto,
  ) {
    console.log(gameRoomId, user.userId, body);
    return 'OK';
  }

  @ApiOperation({
    summary: '게임방 멤버 차단하기',
    description:
      '게임방에서 해당 사용자를 차단합니다. \n\n 멤버 차단은 플레이어1 만 가능합니다.\n\n' +
      'body에 플레이어/관전자 정보를 전달 받게됩니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  @Delete('/room/:game_room_id/ban')
  banPlayerFromGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameMemberBanDto,
  ) {
    console.log(gameRoomId, user.userId, body);
    return 'OK';
  }

  @ApiOperation({
    summary: '게임방 멤버 상태 전환 (플레이어 <-> 관전자)',
    description:
      '게임방에서 해당 사용자의 상태를 변경합니다.\n\n' +
      'body에 플레이어/관전자 정보를 전달 받게됩니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  @Delete('/room/:game_room_id/move')
  moveGameMemberInGameRoom(
    @Param('game_room_id') gameRoomId: number,
    @AuthUser() user: User,
    @Body() body: GameMemberMoveDto,
  ) {
    console.log(gameRoomId, user.userId, body);
    return 'OK';
  }

  @ApiOperation({
    summary: '유저의 게임결과 조회하기',
    description: '파라미터로 전달되는 유저의 게임 결과 전체를 조회합니다.',
  })
  @Get('/:user_id/results')
  getGameResultsByUserId(@Param('user_id') userId: number) {
    console.log(userId);
    return 'OK';
  }

  @ApiOperation({
    summary: '유저의 승률 조회하기',
    description: '파라미터로 전달되는 유저의 승률을 조회합니다.',
  })
  @Get('/:user_id/win_rate')
  getWinRateByUserId(@Param('user_id') userId: number) {
    console.log(userId);
    return 'OK';
  }
}
