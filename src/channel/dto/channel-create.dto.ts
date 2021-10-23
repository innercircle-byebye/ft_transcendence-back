import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Channel } from 'src/entities/Channel';

export class ChannelInfoDto extends PickType(Channel, [
  'password',
  'maxParticipantNum',
]) {
  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  password: string | null;

  @IsNumber()
  @ApiProperty({ required: true })
  maxParticipantNum: number;

  @IsOptional()
  @ApiProperty({
    type: ['number'],
    description: '채널 생성시 초대할 사용자들의 ID 번호 배열 ',
    required: false,
  })
  invitedUsers: number[];
}
