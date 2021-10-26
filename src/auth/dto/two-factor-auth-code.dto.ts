import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFactorAuthCodeDto {
  @ApiProperty({
    type: 'string',
    description: 'google authenticator에서 발급받은 otp코드',
  })
  @IsNotEmpty()
  @IsString()
  twoFactorAuthCode: string;
}
