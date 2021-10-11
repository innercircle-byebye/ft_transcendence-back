import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  IN_GAME = 'in_game',
  NOT_REGISTERED = 'not_registered',
}

@Entity('user')
export class User {
  @ApiProperty({
    description: '유저 DB테이블 ID번호',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'user_id' })
  userId: number;

  @ApiProperty({
    description: '이메일 주소',
    example: 'marvin@student.42.fr',
    required: true,
  })
  @Column('varchar', { name: 'email', length: 50, unique: true })
  email: string;

  @ApiProperty({
    description: '42 인트라 ID',
    example: 'marvin',
    required: true,
  })
  @Column('varchar', { name: 'intra_username', length: 50, unique: true })
  intraUsername: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '퐁게임너무재미있네',
    required: true,
  })
  @Column('varchar', { name: 'nickname', length: 50 })
  nickname: string;

  @ApiProperty({
    description: '프로필 이미지 경로',
    required: true,
  })
  @Column('varchar', { name: 'image_path', length: 200, unique: true })
  imagePath: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ONLINE,
  })
  @ApiProperty({
    description: '유저 상태',
    required: true,
    example: UserStatus.ONLINE,
    examples: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    description: '유저 경험치',
    required: true,
    default: 42,
    example: 42,
  })
  @Column('integer', { name: 'experience' })
  experience: number;

  @ApiProperty({
    description: '유저 랭크',
    default: 1,
    example: 1,
  })
  // nullable 하면 업데이트시 null로 초기화 됨
  // @Column('integer', { name: 'rank_id', nullable: true })
  @Column('integer', { name: 'rank_id' })
  rankId: number; // 안써도 잘 동작하는데 명시적으로 넣은듯

  @ApiProperty({
    description: '유저 밴 기한',
    default: null,
  })
  @Column({
    type: 'timestamptz',
    name: 'ban_date',
    nullable: true,
  })
  banDate: Date | null;

  @ApiProperty({
    description: '유저 상태 공개 유무',
    nullable: true,
    default: true,
    examples: [true, false],
  })
  @Column({ name: 'is_status_pubic', type: 'boolean', default: true })
  isStatusPublic: boolean;

  @ApiProperty({
    description: '유저 게임 기록 공개 유무',
    nullable: true,
    default: true,
    examples: [true, false],
  })
  @Column({ name: 'is_history_public', type: 'boolean', default: true })
  isHistoryPublic: boolean;

  @ApiProperty({
    description: '유저 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '유저 정보 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '유저 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;
}
