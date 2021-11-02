import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { IGameObserver } from './interfaces/IGameObserver';
import { IGameRoom } from './interfaces/IGameRoom';
import { IUser } from './interfaces/IUser';

@Entity('game_observer')
export class GameObserver extends BaseEntity implements IGameObserver {
  @ApiProperty({
    description: '게임 방 ID 번호',
    example: 1,
  })
  @PrimaryColumn({ name: 'game_room_id' })
  gameRoomId: number;

  @ManyToOne('GameRoom', 'gameObservers', { primary: true })
  @JoinColumn({ name: 'game_room_id' })
  gameRoom: IGameRoom;

  @ApiProperty({
    description: '관전 유저 ID 번호',
    example: 1,
  })
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne('User', 'gameObservers', { primary: true })
  @JoinColumn({ name: 'user_id' })
  user: IUser;

  @ApiProperty({
    description: '게임 방 출입금지 기한',
    default: null,
  })
  @Column({
    type: 'timestamptz',
    name: 'ban_date',
    nullable: true,
  })
  banDate: Date | null;

  @ApiProperty({
    description: '관전 유저 입장 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: '게임 방 내 유저 정보 수정 일시',
    readOnly: true,
  })
  lastModifiedAt: Date;

  @ApiProperty({
    description:
      '게임 방 내 유저 삭제 일시 (관전 방 나갔을 때, 혹은 게임 방에서 플레이어로 이동 했을 때)',
    readOnly: true,
    default: null,
  })
  deletedAt: Date | null;
}
