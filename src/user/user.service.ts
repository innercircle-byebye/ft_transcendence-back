import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { User } from '../entities/User';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private connection: Connection,
  ) {}

  getAllUsers() {
    return this.userRepository.find();
  }

  async getUser(userId: number) {
    const targetUser = await this.userRepository.findOne({ where: { userId } });
    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }
    return targetUser;
  }

  async registerUser(
    intraUsername: string,
    email: string,
    nickname: string,
    imagePath: string,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const duplicateIntra = await queryRunner.manager
      .getRepository(User)
      .findOne({ where: [{ intraUsername }] });
    if (duplicateIntra) {
      throw new UnauthorizedException(
        '이미 존재하는 사용자입니다. (인트라 ID 확인)',
      );
    }
    const duplicateEmail = await queryRunner.manager
      .getRepository(User)
      .findOne({ where: [{ email }] });
    if (duplicateEmail) {
      throw new UnauthorizedException(
        '이미 존재하는 사용자입니다. (이메일 확인)',
      );
    }
    let createdUser;
    try {
      createdUser = await queryRunner.manager.getRepository(User).save({
        intraUsername,
        email,
        nickname,
        imagePath,
        // 기본값 (추후 수정필요)
        experience: 42,
        rankId: 1,
        // 기본값 (추후 수정필요)
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return createdUser;
  }

  async deleteUser(userId: number) {
    console.log(`user id:${userId}`);
    const targetUser = await this.userRepository.findOne({ where: { userId } });
    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }
    return this.userRepository.softRemove(targetUser);
  }
}
