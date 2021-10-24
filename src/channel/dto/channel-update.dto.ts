import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Channel } from 'src/entities/Channel';

export class ChannelUpdateDto extends PickType(Channel, [
  'name',
  'password',
  'maxParticipantNum',
]) {
  @IsOptional()
  @ApiProperty({ required: false })
  name: string;

  @IsOptional()
  @ApiProperty({ required: false, nullable: true })
  password: string | null;

  @IsNumber()
  @ApiProperty({ required: true })
  maxParticipantNum: number;
}
