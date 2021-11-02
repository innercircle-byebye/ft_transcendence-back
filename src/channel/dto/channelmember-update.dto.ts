import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ChannelMember } from 'src/entities/ChannelMember';

export class ChannelMemberUpdateDto extends PickType(ChannelMember, [
  'banDate',
  'mutedDate',
]) {
  @IsOptional()
  @ApiProperty({ required: false })
  banDate: Date | null;

  @IsOptional()
  @ApiProperty({ required: false })
  mutedDate: Date | null;

  @IsOptional()
  @ApiProperty({
    description: '수정할사용자의 ID 번호',
    type: 'number',
    example: 1,
    required: true,
  })
  targetUserId: number;
}
