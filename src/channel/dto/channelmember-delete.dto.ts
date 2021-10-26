import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ChannelMemberDeleteDto {
  @IsNumber()
  @ApiProperty({
    description: '삭제될 사용자의 ID 번호',
    type: 'number',
    example: 1,
  })
  targetUserId: number;
}
