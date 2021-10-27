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
import { Admin } from './Admin';
import { IReport } from './interfaces/IReport';
import { User } from './User';

@Entity('report')
export class Report implements IReport {
  @PrimaryGeneratedColumn({ type: 'int', name: 'report_id' })
  reportId: number;

  @Column({ type: 'int', name: 'requester_id' })
  reporterId: number;

  @Column({ type: 'int', name: 'respondent_id' })
  respondentId: number;

  @Column({ type: 'text', name: 'report_content' })
  reportContent: string;

  @Column({ type: 'int', name: 'admin_id', nullable: true })
  adminId: number | null;

  @Column({ type: 'text', name: 'report_result', nullable: true })
  reportResult: number | null;

  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'requester_id', referencedColumnName: 'userId' }])
  reporter: User;

  @ManyToOne(() => User)
  @JoinColumn([{ name: 'respondent_id', referencedColumnName: 'userId' }])
  respondent: User;

  @ManyToOne(() => Admin)
  @JoinColumn([{ name: 'admin_id', referencedColumnName: 'adminId' }])
  admin: Admin;
}
