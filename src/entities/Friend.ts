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

export enum FriendStatus {
  WAIT = 'wait',
  APPROVE = 'approve',
  REJECT = 'reject',
}

@Entity('friend')
export class Friend {
  @PrimaryGeneratedColumn({ type: 'int', name: 'friend_id' })
  friendId: number;

  @Column({ type: 'int', name: 'requester_id' })
  requesterId: number;

  @Column({ type: 'int', name: 'respondent_id' })
  respondentId: number;

  @Column({
    type: 'enum',
    name: 'status',
    enum: FriendStatus,
    default: FriendStatus.WAIT,
  })
  status: FriendStatus;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'requester_id', referencedColumnName: 'userId' }])
  requester: User;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'respondent_id', referencedColumnName: 'userId' }])
  respondent: User;
}
