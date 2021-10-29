import { PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ChannelMember } from 'src/entities/ChannelMember';

export class ChannelMemberUpdateDto extends PickType(ChannelMember, [
  'banDate',
  'mutedDate',
]) {
  @IsOptional()
  targetUserId: number;

  @IsOptional()
  banDate: Date;

  @IsOptional()
  mutedDate: Date | null;
}
