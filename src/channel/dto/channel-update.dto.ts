import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Channel } from 'src/entities/Channel';

export class ChannelUpdateDto extends PickType(Channel, [
  'password',
  'maxParticipantNum',
]) {
  @IsOptional()
  @ApiProperty({ description: '업데이트 될 채널의 이름', required: false })
  updateName: string;

  @IsOptional()
  password: string | null;

  @IsOptional()
  maxParticipantNum: number;
}
