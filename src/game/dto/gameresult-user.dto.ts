// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { GameResult } from 'src/entities/GameResult';

export class GameResultUserDto extends GameResult {
  @ApiProperty({
    description: 'Player 1의 닉네임',
  })
  playerOneNickname: string;

  @ApiProperty({
    description: 'Player 2의 닉네임',
  })
  playerTwoNickname: string;
}
