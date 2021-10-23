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
import { IAdmin } from './interfaces/IAdmin';
import { IAnnouncement } from './interfaces/IAnnouncement';

@Entity('admin')
export class Admin implements IAdmin {
  @ApiProperty({
    description: '관리자 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'admin_id' })
  adminId: number;

  @ApiProperty({
    description: '관리자 이메일 (로그인시 필요)',
    example: 'aaa@bb.com',
  })
  @Column('varchar', { name: 'email', length: 50, unique: true })
  email: string;

  @ApiProperty({
    description: '관리자 비밀번호',
  })
  @Column('varchar', { name: 'email', length: 100 })
  password: string;

  @ApiProperty({
    description: '관리자 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '관리자 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '관리자 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany('Announcement', 'admin')
  announcements: IAnnouncement[];
}
