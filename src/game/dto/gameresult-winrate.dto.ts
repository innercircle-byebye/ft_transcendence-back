import { ApiProperty } from '@nestjs/swagger';

// import { ApiProperty, OmitType } from '@nestjs/swagger';
export class GameResultWinRateDto {
  @ApiProperty({
    type: 'number',
    description: '총 게임 횟수',
  })
  totalPlayCount: number;

  @ApiProperty({
    type: 'number',
    description: '승리 횟수',
  })
  winCount: number;

  @ApiProperty({
    type: 'number',
    description: '패배 횟수',
  })
  loseCount: number;

  @ApiProperty({
    type: 'number',
    description: '승률 (소수점도 숫자로 표현 한다고 합니다)',
  })
  winRate: number;
}
