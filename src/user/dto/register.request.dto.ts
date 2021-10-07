import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({
    example: '나는퐁게임을했다',
    description: '사용자 닉네임',
    required: true,
  })
  public nickaname: string;

  @ApiProperty({
    description: '프로필 이미지 경로',
    required: false,
  })
  public profileImage: string;
}
