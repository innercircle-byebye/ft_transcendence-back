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
import { User } from './User';

export enum DMType {
  PLAIN = 'plain',
  CHANNEL_INVITE = 'channel_invite',
  GAME_INVITE = 'game_invite',
}

@Entity('dm')
export class DM {
  @ApiProperty({
    description: 'DM 아이디번호',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'dm_id' })
  dmId: number;

  @ApiProperty({
    description: '보낸사람 아이디번호',
    example: 1,
  })
  @Column({ type: 'int', name: 'sender_id' })
  senderId: number;

  @ApiProperty({
    description: '받는사람 아이디번호',
    example: 2,
  })
  @Column({ type: 'int', name: 'receiver_id' })
  receiverId: number;

  @ApiProperty({
    description: 'DM 타입(일반, 채널초대, 게임초대)',
    example: DMType.PLAIN,
    examples: DMType,
  })
  @Column({
    name: 'type',
    type: 'enum',
    enum: DMType,
    default: DMType.PLAIN,
  })
  type: DMType;

  @ApiProperty({
    description: 'DM 내용',
    example: '안녕하세요~',
  })
  @Column({ type: 'text', name: 'content' })
  content: string;

  @ApiProperty({
    description: '생성 일시',
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '최종수정 일시',
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '삭제 일시',
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ApiProperty({
    description: '보낸 사람',
  })
  @ManyToOne(() => User)
  @JoinColumn([{ name: 'sender_id', referencedColumnName: 'userId' }])
  sender: User;

  @ApiProperty({
    description: '받는 사람',
  })
  @ManyToOne(() => User)
  @JoinColumn([{ name: 'receiver_id', referencedColumnName: 'userId' }])
  receiver: User;
}
