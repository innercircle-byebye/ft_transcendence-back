import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Channel } from 'src/entities/Channel';

export class ChannelJoinDto extends PickType(Channel, ['password']) {
  @IsOptional()
  @ApiProperty({ description: '비밀번호', required: false, nullable: true })
  password: string | null;

  @IsOptional()
  @ApiProperty({
    description: '초대 받은 사용자의 ID',
    required: false,
    nullable: true,
  })
  targetUserId: number;
}
