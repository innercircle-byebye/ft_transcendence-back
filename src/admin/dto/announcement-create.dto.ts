import { PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Announcement } from 'src/entities/Announcement';

export class AnnouncementCreateDto extends PickType(Announcement, [
  'title',
  'content',
]) {
  @IsString()
  title: string;

  @IsString()
  content: string;
}
