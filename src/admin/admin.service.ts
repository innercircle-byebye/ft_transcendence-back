import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Report } from 'src/entities/Report';
import { Connection, Repository } from 'typeorm';
import bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private connection: Connection,
  ) {}

  getAnnouncement() {
    return this.announcementRepository.find();
  }

  async createAdmin(email: string, password: string, fromId: number) {
    const user = await this.adminRepository.findOne({ where: { email } });
    if (user) {
      throw new ForbiddenException('이미 존재하는 이메일입니다');
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = new Admin();
    newAdmin.email = email;
    newAdmin.password = hashedPassword;
    newAdmin.fromId = fromId;
    return this.adminRepository.save(newAdmin);
  }
}
