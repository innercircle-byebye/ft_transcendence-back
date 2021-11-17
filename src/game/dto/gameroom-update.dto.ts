// import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { BallSpeed, GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';

export class GameRoomUpdateDto extends IntersectionType(
  OmitType(GameRoom, ['gameRoomId']),
  PickType(GameResult, ['ballSpeed', 'winPoint']),
) {
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  title: string;

  @IsOptional()
  @ApiProperty({
    required: false,
  })
  password: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  maxParticipantNum: number;

  @IsOptional()
  @ApiProperty({
    required: false,
  })
  ballSpeed: BallSpeed;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  winPoint: number;
}
