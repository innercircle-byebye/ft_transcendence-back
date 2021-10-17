import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Entity('block')
export class Block {
  @PrimaryGeneratedColumn({ type: 'int', name: 'block_id' })
  blockId: number;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @Column({ type: 'int', name: 'blocked_user_id' })
  blockedUserId: number;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  // TODO: User와 관계 형성해야함
  @ManyToOne(() => User)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'userId' }])
  user: User;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'blocked_user_id', referencedColumnName: 'userId' }])
  blockedUser: User;
}
