import { PickType } from '@nestjs/swagger';
import { ChannelChat } from 'src/entities/ChannelChat';

export class ChannelChatCreateDto extends PickType(ChannelChat, ['content']) {}
