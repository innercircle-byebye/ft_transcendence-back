import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { User } from 'src/entities/User';
import { GameResultWinRateDto } from './gameresult-winrate.dto';

export class GameResultRankingDto extends IntersectionType(
  GameResultWinRateDto,
  PickType(User, ['experience']),
) {
  @ApiProperty({
    type: PickType(User, ['userId', 'nickname', 'imagePath']),
  })
  user: any;
}
