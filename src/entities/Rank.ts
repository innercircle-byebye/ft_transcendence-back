import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { IRank } from './interfaces/IRank';

@Entity('rank')
export class Rank implements IRank {
  @ApiProperty({
    description: '랭크 테이블 ID번호',
    example: 1,
  })
  @PrimaryColumn({ type: 'int', name: 'rank_id' })
  rankId: number;

  @ApiProperty({
    description: '랭크 이름',
    example: '브론즈',
  })
  @Column('varchar', { name: 'title', length: 50, unique: true })
  title: string;

  @ApiProperty({ description: '기준 경험치', example: 42 })
  @Column({ type: 'int', name: 'criteria_experience' })
  criteriaExperience: number;

  @ApiProperty({
    description: '랭크 이미지 경로',
  })
  @Column('varchar', { name: 'image_path', length: 200, unique: true })
  imagePath: string;
}
