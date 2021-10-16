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
import { IChannel } from './interfaces/IChannel';
import { IChannelMember } from './interfaces/IChannelMember';
import { IUser } from './interfaces/IUser';

@Entity('channel_member')
export class ChannelMember implements IChannelMember {
  @ApiProperty({
    description: '채널 내 유저 음소거 기한',
    default: null,
  })
  @Column({
    type: 'timestamptz',
    name: 'muted_date',
    nullable: true,
  })
  mutedDate: Date | null;

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
    description: '채널 내 관리자 유무',
    nullable: true,
    default: true,
    examples: [true, false],
  })
  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  @ApiProperty({
    description: '채널 내 유저 입장 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '채널 내 유저 정보 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '채널 내 유저 삭제 일시 (채널 나갔을 때)',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @ManyToOne('User', 'channelMember', { primary: true })
  @JoinColumn({ name: 'user_id' })
  user: IUser;

  @PrimaryColumn({ name: 'channel_id' })
  channelId: number;

  @ManyToOne('Channel', 'channelMember', { primary: true })
  @JoinColumn({ name: 'channel_id' })
  channel: IChannel;
}
