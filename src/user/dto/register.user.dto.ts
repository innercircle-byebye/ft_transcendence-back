import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class RegisterUserDto extends PickType(User, [
  'intraUsername',
  'nickname',
  'email',
  'imagePath',
] as const) {
  @ApiProperty({
    description: '유저 DB테이블 ID번호',
    example: 1,
  })
  @IsString()
  @IsNotEmpty()
  intraUsername: string;

  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // TODO: isUrl class validation으로 수정
  @IsNotEmpty()
  @IsString()
  imagePath: string;
}
