import { OmitType } from '@nestjs/swagger';
import { Channel } from 'src/entities/Channel';

export class ChannelDto extends OmitType(Channel, ['password']) {}
