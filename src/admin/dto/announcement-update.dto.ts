import { PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Announcement } from 'src/entities/Announcement';

export class AnnouncementUpdateDto extends PickType(Announcement, [
  'title',
  'content',
]) {
  @IsOptional()
  title: string;

  @IsOptional()
  content: string;
}
