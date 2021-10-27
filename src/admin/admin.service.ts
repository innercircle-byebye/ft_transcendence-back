import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Connection, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private connection: Connection,
  ) {}

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
    const checkEmail = await this.adminRepository.findOne({ where: { email } });
    if (checkEmail) {
      throw new ForbiddenException('이미 존재하는 이메일입니다.');
    }
    const checkNickname = await this.adminRepository.findOne({
      where: { nickname },
    });
    if (checkNickname) {
      throw new ForbiddenException('이미 존재하는 닉네임입니다.');
    }
    const hashedPassword = await bcrypt.hash(password, 12);

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
    if (email || nickname || password) {
      const targetAdmin = await this.adminRepository.findOne({
        where: { adminId },
      });
      if (email && email !== targetAdmin.email) {
        const checkEmail = await this.adminRepository.findOne({
          where: { email },
        });
        if (checkEmail)
          throw new ForbiddenException('이미 존재하는 이메일입니다.');
        targetAdmin.email = email;
      }
      if (nickname && nickname !== targetAdmin.nickname) {
        const checkNickname = await this.adminRepository.findOne({
          where: { nickname },
        });
        if (checkNickname)
          throw new ForbiddenException('이미 존재하는 닉네임입니다.');
        targetAdmin.nickname = nickname;
      }
      // 비밀번호는 중복 검사 필요없이 항상 업데이트 되도록
      if (password) {
        const newPassword = await bcrypt.hash(password, 12);
        targetAdmin.password = newPassword;
      }
      return this.adminRepository.save(targetAdmin);
    }
    return null;
  }

  getAllAnnouncement() {
    return this.announcementRepository.find();
  }

  getAnnouncementByMe(adminId: number) {
    return this.announcementRepository.find({ where: { adminId } });
  }

  getAnnouncementById(announcementId: number) {
    return this.announcementRepository.find({ where: { announcementId } });
  }

  createAnnouncement(adminId: number, title: string, content: string) {
    const announcement = new Announcement();
    announcement.adminId = adminId;
    announcement.title = title;
    announcement.content = content;

    return this.announcementRepository.save(announcement);
  }

  async deleteAnnouncemnt(announcementId: number, adminId: number) {
    const targetAnnouncement = await this.announcementRepository.findOne({
      where: { announcementId },
    });
    if (!targetAnnouncement)
      throw new BadRequestException('공지사항이 존재 하지 않습니다.');
    if (targetAnnouncement.adminId !== adminId)
      throw new BadRequestException('작성자 ID와 일치 하지 않습니다.');

    return this.announcementRepository.softRemove(targetAnnouncement);
  }

  async modifyAnnouncement(
    announcementId: number,
    adminId: number,
    title: string,
    content: string,
  ) {
    const targetAnnouncement = await this.announcementRepository.findOne({
      where: { announcementId },
    });
    if (!targetAnnouncement)
      throw new BadRequestException('공지사항이 존재 하지 않습니다.');
    if (targetAnnouncement.adminId !== adminId)
      throw new BadRequestException('작성자 ID와 일치 하지 않습니다.');
    if (title) targetAnnouncement.title = title;
    if (content) targetAnnouncement.content = content;

    return this.announcementRepository.save(targetAnnouncement);
  }
}
