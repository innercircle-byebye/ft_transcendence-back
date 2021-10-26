import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { ChannelMember } from 'src/entities/ChannelMember';

export class ChannelMemberUpdateDto extends PickType(ChannelMember, [
  'banDate',
  'mutedDate',
  'isAdmin',
]) {
  @IsNumber()
  @ApiProperty({ description: '관리자가 될 사용자의 id', type: 'number' })
  targetUserId: number;
}
