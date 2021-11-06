// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IntersectionType, OmitType, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { BallSpeed, GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';

export class GameRoomCreateDto extends IntersectionType(
  OmitType(GameRoom, ['gameRoomId']),
  PickType(GameResult, ['ballSpeed', 'winPoint']),
) {
  @IsString()
  title: string;

  @IsNumber()
  maxParticipantNum: number;

  @IsNumber()
  winPoint: number;

  @IsString()
  ballSpeed: BallSpeed;

  @IsOptional()
  password: string;
}
