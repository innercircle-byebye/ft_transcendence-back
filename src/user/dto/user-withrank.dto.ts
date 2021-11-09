// import { PickType } from '@nestjs/swagger';
import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { Rank } from 'src/entities/Rank';
import { User } from 'src/entities/User';

export class UserWithRankDto extends OmitType(User, [
  'currentHashedRefreshToken',
]) {
  @ApiProperty({
    type: PickType(Rank, ['title', 'imagePath']),
    isArray: true,
  })
  rankInfo: any;
}
