// import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserRole } from './userrole.enum';

export class GameRoomLeaveDto {
  @IsNotEmpty()
  @ApiProperty({
    description: '게임방 참여 분류',
    required: true,
    example: UserRole.PLAYER,
    examples: UserRole,
  })
  role: string;
}
