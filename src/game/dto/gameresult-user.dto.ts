// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { OmitType } from '@nestjs/swagger';
import { GameResult } from 'src/entities/GameResult';

export class GameResultUserDto extends OmitType(GameResult, [
  'playerOne',
  'playerTwo',
]) {}
