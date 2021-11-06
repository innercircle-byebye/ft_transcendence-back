import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class UpdateUserVersionTwoDto extends PartialType(
  PickType(User, [
    'email',
    'nickname',
    'imagePath',
    'isStatusPublic',
    'isHistoryPublic',
  ]),
) {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  nickname: string;

  @IsOptional()
  isStatusPublic: boolean;

  @IsOptional()
  isHistoryPublic: boolean;

  @IsOptional()
  @ApiProperty({
    type: 'file',
    name: 'imagePath',
    description: '업로드 된 이미지 파일의 경로',
  })
  imagePath: string;
}
