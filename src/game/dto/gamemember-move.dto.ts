// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PickType } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { GameMember, GameMemberStatus } from 'src/entities/GameMember';

export class GameMemberMoveDto extends PickType(GameMember, [
  'userId',
  'status',
]) {
  @IsNumber()
  userId: number;

  @IsString()
  status: GameMemberStatus;
}
