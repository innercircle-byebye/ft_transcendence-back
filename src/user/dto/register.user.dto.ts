import { PickType } from '@nestjs/swagger';
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
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  imagePath: string;
}
