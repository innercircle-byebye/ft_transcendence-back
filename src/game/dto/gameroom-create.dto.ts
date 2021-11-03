// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IntersectionType, OmitType, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';

export class GameRoomCreateDto extends IntersectionType(
  OmitType(GameRoom, ['gameRoomId']),
  PickType(GameResult, ['ballSpeed']),
) {
  @IsOptional()
  password: string;
}
