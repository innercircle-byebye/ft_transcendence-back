import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/Announcement';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    private connection: Connection,
  ) {}

  getAnnouncement() {
    return this.announcementRepository.find();
  }
}
