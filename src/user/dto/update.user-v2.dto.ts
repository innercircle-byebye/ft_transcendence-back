import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class UpdateUserVersionTwoDto extends PartialType(
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

  @IsOptional()
  @ApiProperty({
    type: 'file',
    name: 'imagePath',
    description: '업로드 된 이미지 파일의 경로',
  })
  imagePath: string;
}
