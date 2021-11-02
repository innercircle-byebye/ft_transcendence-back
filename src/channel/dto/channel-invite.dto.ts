import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class ChannelInviteDto {
  @IsArray()
  @ApiProperty({
    type: ['number'],
    description: '채널 생성시 초대할 사용자들의 ID 번호 배열 ',
  })
  invitedUsers: number[];
}
