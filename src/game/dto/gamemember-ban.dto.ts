// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { GameMember } from 'src/entities/GameMember';

export class GameMemberBanDto extends PickType(GameMember, [
  'userId',
  'banDate',
]) {
  @IsNumber()
  userId: number;

  @IsOptional()
  banDate: Date;
}
