// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { GameRoom } from 'src/entities/GameRoom';
import { UserRole } from './userrole.enum';

export class GameRoomJoinDto extends PickType(GameRoom, ['password']) {
  @IsNotEmpty()
  @ApiProperty({
    description: '게임방 참여 분류',
    required: true,
    example: UserRole.PLAYER,
    examples: UserRole,
  })
  role: string;

  @IsOptional()
  password: string;
}
