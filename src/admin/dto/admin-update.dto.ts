import { PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Admin } from 'src/entities/Admin';

export class AdminUpdateDto extends PickType(Admin, [
  'email',
  'nickname',
  'password',
]) {
  @IsOptional()
  email: string;

  @IsOptional()
  nickname: string;

  @IsOptional()
  password: string;
}
