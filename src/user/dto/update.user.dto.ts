import { PartialType } from '@nestjs/mapped-types';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class UpdateUserDto extends PartialType(User) {}
