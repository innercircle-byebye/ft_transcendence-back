import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ChannelChat } from 'src/entities/ChannelChat';

export class ChannelChatListDto extends OmitType(ChannelChat, ['user']) {
  @ApiProperty({
    type: 'object',
    properties: {
      imagePath: {
        type: 'string',
      },
      nickname: {
        type: 'string',
      },
    },
  })
  user: Map<string, string>;
}
