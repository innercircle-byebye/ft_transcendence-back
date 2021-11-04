import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IGameResult } from './interfaces/IGameResult';
import { IGameRoom } from './interfaces/IGameRoom';
import { User } from './User';

export enum BallSpeed {
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow',
}
@Entity('game_result')
export class GameResult extends BaseEntity implements IGameResult {
  @ApiProperty({
    description: '게임 결과 ID 번호',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'game_result_id' })
  gameResultId: number;

  @ManyToOne('GameRoom', 'gameResults')
  @JoinColumn({ name: 'game_room_id' })
  gameRoom: IGameRoom;

  @ApiProperty({
    description: '게임 방 ID',
    example: 1,
  })
  @Column({ name: 'game_room_id' })
  gameRoomId: number;

  @ApiProperty({
    description: '플레이어 1 ID',
  })
  @Column({ type: 'int', name: 'player1_id' })
  playerOneId: number;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'player1_id', referencedColumnName: 'userId' }])
  playerOne: User;

  @ApiProperty({
    description: '플레이어 2 ID (null 가능)',
    nullable: true,
  })
  @Column({ type: 'int', name: 'player2_id', nullable: true })
  playerTwoId: number;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'player2_id', referencedColumnName: 'userId' }])
  playerTwo: User;

  @ApiProperty({
    description: '플레이어 1의 결과 점수',
    example: 15,
    nullable: true,
  })
  @Column({ type: 'int', name: 'player1_score', nullable: true })
  playerOneScore: number | null;

  @ApiProperty({
    description: '플레이어 2의 결과 점수',
    example: 10,
    nullable: true,
  })
  @Column({ type: 'int', name: 'player2_score', nullable: true })
  playerTwoScore: number | null;

  @ApiProperty({
    description: '게임 승리를 위한 점수',
    example: 15,
  })
  @Column({ type: 'int', name: 'win_point' })
  winPoint: number;

  @Column({
    name: 'ball_speed',
    type: 'enum',
    enum: BallSpeed,
    default: BallSpeed.MEDIUM,
  })
  @ApiProperty({
    required: true,
    description: '공 속도',
    example: BallSpeed.MEDIUM,
    examples: BallSpeed,
  })
  ballSpeed: BallSpeed;

  @ApiProperty({
    description: '게임 시작 시간',
    default: null,
  })
  @Column({
    type: 'timestamptz',
    name: 'start_at',
    nullable: true,
  })
  startAt: Date | null;

  @ApiProperty({
    description: '게임 종료 시간',
    default: null,
  })
  @Column({
    type: 'timestamptz',
    name: 'end_at',
    nullable: true,
  })
  endAt: Date | null;

  @ApiProperty({
    description: '게임 방 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  lastModifiedAt: Date;
}
