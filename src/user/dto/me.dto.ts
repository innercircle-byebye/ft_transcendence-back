// import { PickType } from '@nestjs/swagger';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Rank } from 'src/entities/Rank';
import { UserDto } from './user.dto';

export class MeDto extends UserDto {
  @ApiProperty({
    description: '유저 2FA 사용 유무',
    default: false,
    examples: [true, false],
  })
  isTwoFactorAuthEnabled: boolean;

  @ApiProperty({
    type: PickType(Rank, ['title', 'imagePath']),
    isArray: true,
  })
  rankInfo: any;
}
