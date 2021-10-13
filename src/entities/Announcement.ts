import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('announcement')
export class Announcement {
  @ApiProperty({
    description: '공지사항 아이디 번호 (순번)',
    example: 1,
  })
  @PrimaryGeneratedColumn({ type: 'int', name: 'announcement_id' })
  announcementId: number;

  @ApiProperty({
    description: '작성자(관리자) ID',
    example: 1,
    required: true,
  })
  @Column({ type: 'int', name: 'admin_id' })
  adminId: number;

  @ApiProperty({
    description: '제목',
    example: '[이벤트] 지금 게임 하시면 별이 다섯개!',
    required: true,
  })
  @Column('varchar', { name: 'title', length: 100 })
  title: string;

  @ApiProperty({
    description: '공지사항 내용',
    required: true,
  })
  @Column({ type: 'text', name: 'content' })
  content: string;

  @ApiProperty({
    description: '공지사항 생성 일시',
    readOnly: true,
  })
  @CreateDateColumn({ name: 'created_at' })
  readonly createdAt: Date;

  @ApiProperty({
    description: '공지사항 수정 일시',
    readOnly: true,
  })
  @UpdateDateColumn({ name: 'last_modified_at' })
  readonly lastModifiedAt: Date;

  @ApiProperty({
    description: '유저 삭제 일시',
    readOnly: true,
    default: null,
  })
  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
