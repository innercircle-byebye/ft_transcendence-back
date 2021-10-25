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

@Entity('dm')
export class DM {
  @PrimaryGeneratedColumn({ type: 'int', name: 'dm_id' })
  dmId: number;

  @Column({ type: 'int', name: 'sender_id' })
  senderId: number;

  @Column({ type: 'int', name: 'receiver_id' })
  receiverId: number;

  @Column({ type: 'text', name: 'content' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'sender_id', referencedColumnName: 'userId' }])
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'receiver_id', referencedColumnName: 'userId' }])
  receiver: User;
}
