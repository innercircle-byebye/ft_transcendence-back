import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ChannelMember } from 'src/entities/ChannelMember';

export class ChannelMemberDto extends OmitType(ChannelMember, ['user']) {
  @ApiProperty({
    type: 'object',
    properties: {
      imagePath: {
        type: 'string',
        example: 'https://picsum.photos/id/10/500/500',
      },
      nickname: {
        type: 'string',
        example: 'temp1',
      },
    },
  })
  user: Map<string, string>;
}
