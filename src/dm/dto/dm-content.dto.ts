import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DMContentDto {
  @ApiProperty({
    type: 'string',
    description: 'DM으로 보낼 내용 (비어있으면 안됨)',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
