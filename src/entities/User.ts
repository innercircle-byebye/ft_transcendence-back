import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  IN_GAME = 'in_game',
  NOT_REGISTERED = 'not_registered',
}

@Entity('user')
export class User {
  @PrimaryGeneratedColumn({ type: 'int', name: 'user_id' })
  userId: number;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: '이메일 주소',
    example: 'marvin@student.42.fr',
    required: true,
  })
  @Column('varchar', { name: 'email', length: 50, unique: true })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '42 인트라 ID',
    example: 'marvin',
    required: true,
  })
  @Column('varchar', { name: 'intra_username', length: 50, unique: true })
  intraUsername: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '사용자 닉네임',
    example: '퐁게임너무재미있네',
    required: true,
  })
  @Column('varchar', { name: 'nickname', length: 50 })
  nickname: string;

  @IsUrl()
  @IsNotEmpty()
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
    example: 42,
  })
  @Column('integer', { name: 'experience' })
  experience: number;

  @ApiProperty({
    description: '유저 랭크',
    example: 1,
  })
  @Column('integer', { name: 'rank_id', nullable: true })
  rankId: number | null; // 안써도 잘 동작하는데 명시적으로 넣은듯

  @Column({ type: 'timestamptz', name: 'ban_date', nullable: true })
  banDate: Date | null;

  @Column({ name: 'is_status_pubic', type: 'boolean', default: true })
  isStatusPublic: boolean;

  @Column({ name: 'is_history_public', type: 'boolean', default: true })
  isHistoryPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;
}
