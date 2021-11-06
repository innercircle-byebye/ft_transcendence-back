// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { GameMemberStatus } from 'src/entities/GameMember';
import { GameRoom } from 'src/entities/GameRoom';

export class GameRoomJoinDto extends PickType(GameRoom, ['password']) {
  @IsNotEmpty()
  @ApiProperty({
    description: '게임방 참여 분류 -- Player 1은 안됨',
    required: true,
    example: GameMemberStatus.PLAYER_TWO,
    examples: [GameMemberStatus.OBSERVER, GameMemberStatus.PLAYER_TWO],
  })
  role: string;

  @IsOptional()
  password: string;
}
