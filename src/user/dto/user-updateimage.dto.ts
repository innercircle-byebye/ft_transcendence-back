import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from 'src/entities/User';

// 따로 선언 하는게 아니라 생략가능
// ref: https://docs.nestjs.com/graphql/mapped-types#mapped-types

export class UserUpdateImageDto extends PickType(User, ['imagePath'] as const) {
  @ApiProperty({
    type: 'file',
    name: 'image',
    description: '업로드 된 이미지 파일의 경로',
  })
  imagePath: string;
}
