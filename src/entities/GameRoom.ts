import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IGameObserver } from './interfaces/IGameObserver';
import { IGameResult } from './interfaces/IGameResult';
import { IGameRoom } from './interfaces/IGameRoom';

@Entity('game_room')
export class GameRoom extends BaseEntity implements IGameRoom {
  @ApiProperty({
    description: '게임 방 ID번호',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'game_room_id' })
  gameRoomId: number;

  @ApiProperty({
    description: '게임 방 제목',
    example: '게임 ㄱㄱ',
  })
  @Column('varchar', { name: 'title', length: 100, unique: true })
  title: string;

  @ApiProperty({
    description: '게임 방 입장 비밀번호',
  })
  @Column('varchar', {
    name: 'password',
    length: 100,
    select: false,
    nullable: true,
  })
  password: string;

  @ApiProperty({
    description: '게임 방 최대 참여자 수',
    example: 8,
  })
  @Column({ type: 'int', name: 'max_participant_num' })
  maxParticipantNum: number;

  @ApiProperty({
    description: '게임 방 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: '게임 방 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  lastModifiedAt: Date;

  @ApiProperty({
    description: '게임 방 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany('GameObserver', 'gameRoom')
  gameObservers: IGameObserver[];

  @OneToMany('GameResult', 'gameRoom')
  gameResults: IGameResult[];
}
