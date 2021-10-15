import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IChannelChat } from './interfaces/IChannelChat';

@Entity('channel')
export class Channel {
  @ApiProperty({
    description: '채널 DB테이블 ID 번호',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'channel_id' })
  channelId: number;

  @ApiProperty({
    description: '채널명 (사용자가 입력, 수정 하는채널의 이름)',
    example: '게임하다가 심심한데 대화 히실분 구함',
    required: true,
  })
  @Column('varchar', { name: 'name', length: 100 })
  name: string;

  @ApiProperty({
    description: '채널 입장 비밀번호',
  })
  @Column('varchar', { name: 'password', length: 100, select: false })
  password: string;

  @ApiProperty({
    description: '현재 채널 최대 참여자 수',
    example: 42,
  })
  @Column({ type: 'int', name: 'max_participant_num' })
  maxParticipantNum: number;

  @ApiProperty({
    description: '채팅 채널 정보 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '채팅 채널 정보 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '채팅 채널 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany('ChannelChat', 'channel')
  channelChats: IChannelChat[];
}
