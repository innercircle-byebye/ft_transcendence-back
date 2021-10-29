import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';
import { ChannelMember } from 'src/entities/ChannelMember';

export class ChannelMemberAdminDto extends PickType(ChannelMember, [
  'isAdmin',
]) {
  @IsNumber()
  @ApiProperty({
    description: '관리자가 될 사용자의 id',
    type: 'number',
    example: 2,
  })
  targetUserId: number;

  @IsBoolean()
  isAdmin: boolean;
}
