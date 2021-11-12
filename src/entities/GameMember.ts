import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IGameMember } from './interfaces/IGameMember';
import { IGameRoom } from './interfaces/IGameRoom';
import { IUser } from './interfaces/IUser';

export enum GameMemberStatus {
  PLAYER_ONE = 'player1',
  PLAYER_TWO = 'player2',
  OBSERVER = 'observer',
}

@Entity('game_member')
export class GameMember implements IGameMember {
  @ManyToOne('GameRoom', 'gameMembers', { primary: true })
  @JoinColumn({ name: 'game_room_id' })
  gameRoom: IGameRoom;

  @ApiProperty({
    description: '게임 방 ID 번호',
    example: 1,
  })
  @PrimaryColumn({ name: 'game_room_id' })
  gameRoomId: number;

  @ApiProperty({
    description: '관전 유저 ID 번호',
    example: 1,
  })
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne('User', 'gameMembers', { primary: true })
  @JoinColumn({ name: 'user_id' })
  user: IUser;

  @Column({
    name: 'status',
    type: 'enum',
    enum: GameMemberStatus,
    default: GameMemberStatus.PLAYER_ONE,
  })
  @ApiProperty({
    description: '게임 방 참여 유저 상태',
    required: true,
    example: GameMemberStatus.PLAYER_ONE,
    examples: GameMemberStatus,
  })
  status: GameMemberStatus;

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
  @UpdateDateColumn({ name: 'last_modified_at' })
  lastModifiedAt: Date;

  @ApiProperty({
    description:
      '게임 방 내 유저 삭제 일시 (관전 방 나갔을 때, 혹은 게임 방에서 플레이어로 이동 했을 때)',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
