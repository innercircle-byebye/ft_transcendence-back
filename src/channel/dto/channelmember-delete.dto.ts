import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class ChannelMemberDeleteDto {
  @IsOptional()
  @ApiProperty({
    description: '삭제될 사용자의 ID 번호',
    type: 'number',
    example: 1,
  })
  targetUserId: number;
}
