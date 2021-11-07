// import { PickType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class MeDto extends UserDto {
  @ApiProperty({
    description: '유저 2FA 사용 유무',
    default: false,
    examples: [true, false],
  })
  isTwoFactorAuthEnabled: boolean;
}
