import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Channel } from 'src/entities/Channel';

export class ChannelDto extends OmitType(Channel, ['password']) {
  @ApiProperty({
    type: 'boolean',
    description: '개설된 방의 공개 여부',
  })
  isPrivate: boolean;

  @ApiProperty({
    type: 'number',
    description: '현재 채널에 참여중인 유저 명수',
    example: 42,
  })
  currentChatMemberCount: number;
}
