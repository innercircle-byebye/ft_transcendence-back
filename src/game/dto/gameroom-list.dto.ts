// import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { GameMember } from 'src/entities/GameMember';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { GameRoomStatus } from './gameroom.dto';

export class GameRoomListDto extends OmitType(GameRoom, [
  'password',
  'gameMembers',
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
  currentMemberCount: number;

  @ApiProperty({
    examples: GameRoomStatus,
    example: GameRoomStatus.PLAYABLE,
    description: '현재 게임룸 상태',
  })
  gameRoomStatus: GameRoomStatus;
}
