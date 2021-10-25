import { PickType } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';
import { Admin } from 'src/entities/Admin';

export class AdminJoinDto extends PickType(Admin, [
  'email',
  'nickname',
  'password',
  'fromId',
]) {
  @IsEmail()
  email: string;

  @IsString()
  nickname: string;

  @IsString()
  password: string;

  @IsNumber()
  fromId: number;
}
