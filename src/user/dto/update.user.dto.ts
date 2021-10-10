import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class UpdateUserDto extends PartialType(
  OmitType(User, [
    'userId',
    'intraUsername',
    'createdAt',
    'lastModifiedAt',
    'deletedAt',
  ]),
) {
  @IsEmail()
  email: string;
}
