import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Channel } from './Channel';
import { IChannelChat } from './interfaces/IChannelChat';
import { IUser } from './interfaces/IUser';

@Entity('channel_chat')
export class ChannelChat implements IChannelChat {
  @ApiProperty({
    description: '채널 내 채팅 id 번호 (사용자 메세지)',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'channel_id' })
  channelId: number;

  @ApiProperty({
    description: '채팅 내용',
    required: true,
  })
  @Column({ type: 'text', name: 'content' })
  content: string;

  @ApiProperty({
    description: '채팅 메세지 정보 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '채팅 메세지 정보 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '채팅 메세지 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @ManyToOne('User', 'channelChats')
  @JoinColumn({ name: 'user_id' })
  user: IUser;

  @ManyToOne('Channel', 'channelChats')
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;
}