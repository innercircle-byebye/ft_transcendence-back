import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class GameRoomInviteDto {
  @IsNumber()
  @ApiProperty({
    type: 'number',
    description: '게임 초대 요청 사용자의 ID번호',
  })
  invitedUserId: number;
}
