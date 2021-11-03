// import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  ApiProperty,
  IntersectionType,
  OmitType,
  PickType,
} from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { BallSpeed, GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';

export class GameMemberMoveDto extends IntersectionType(
  OmitType(GameRoom, ['gameRoomId']),
  PickType(GameResult, ['ballSpeed']),
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
}
