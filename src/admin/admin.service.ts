import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Report } from 'src/entities/Report';
import { Connection, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

  async getAllAdmin() {
    return this.adminRepository.find();
  }

  async validateAdmin(email: string, password: string) {
    const admin = await this.adminRepository
      .createQueryBuilder('admin')
      .where('admin.email = :email', { email })
      .addSelect('admin.password')
      .getOne();
    console.log(email, password, admin);
    const result = await bcrypt.compare(password, admin.password);
    if (result) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { password, ...userWithoutPassword } = admin;
      return userWithoutPassword;
    }
    return null;
  }

  async createAdmin(
    email: string,
    nickname: string,
    password: string,
    fromId: number,
  ) {
    const user = await this.adminRepository.findOne({ where: { email } });
    if (user) {
      throw new ForbiddenException('이미 존재하는 이메일입니다');
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const fromAdmin = await this.adminRepository.findOne({ where: { fromId } });
    if (!fromAdmin)
      throw new BadRequestException('존재하지 않는 관리자 ID입니다.');

    const newAdmin = new Admin();
    newAdmin.email = email;
    newAdmin.nickname = nickname;
    newAdmin.password = hashedPassword;
    newAdmin.fromId = fromId;
    return this.adminRepository.save(newAdmin);
  }

  async updateAdmin(
    adminId: number,
    email: string,
    nickname: string,
    password: string,
  ) {
    const targetAdmin = await this.adminRepository.findOne({
      where: { adminId },
    });
    if (email) {
      const checkEmail = this.adminRepository.findOne({ where: { email } });
      if (checkEmail)
        throw new ForbiddenException('이미 존재하는 이메일입니다.');
      targetAdmin.email = email;
    }
    if (nickname) {
      const checkNickname = this.adminRepository.findOne({
        where: { nickname },
      });
      if (checkNickname)
        throw new ForbiddenException('이미 존재하는 닉네임입니다.');
      targetAdmin.email = email;
    }
    if (password) {
      const newPassword = await bcrypt.hash(password, 12);
      targetAdmin.password = newPassword;
    }
    return this.adminRepository.save(targetAdmin);
  }
}
