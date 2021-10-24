import { PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ChannelChat } from 'src/entities/ChannelChat';

export class ChannelChatCreateDto extends PickType(ChannelChat, ['content']) {
  @IsString()
  content: string;
}
