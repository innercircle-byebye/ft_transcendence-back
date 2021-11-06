// import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';

export enum GameRoomStatus {
  OBSERVABLE = 'observable',
  PLAYABLE = 'playable',
  FULL = 'full',
}
export class GameRoomDto extends OmitType(GameRoom, [
  'password',
  'gameMembers',
  'gameResults',
]) {
  @ApiProperty({ description: '비밀번호 유무' })
  isPrivate: boolean;

  @ApiProperty({
    type: IntersectionType(
      PickType(GameMember, ['status', 'userId']),
      PickType(User, ['nickname']),
    ),
    isArray: true,
  })
  gameMembers: any;

  @ApiProperty({
    type: 'number',
    description: '현재 게임룸에 참여한 인원',
    example: 4,
  })
  currentNumberCount: number;

  @ApiProperty({
    examples: GameRoomStatus,
    example: GameRoomStatus.PLAYABLE,
    description: '현재 게임룸 상태',
  })
  gameRoomStatus: GameRoomStatus;

  @ApiProperty({
    type: () => [
      OmitType(GameResult, ['gameRoomId', 'playerOne', 'playerTwo']),
    ],
  })
  gameResults: GameResult;
}
