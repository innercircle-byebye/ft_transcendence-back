import { PickType } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';
import { Admin } from 'src/entities/Admin';

export class AdminJoinDto extends PickType(Admin, [
  'email',
  'password',
  'fromId',
]) {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsNumber()
  fromId: number;
}
