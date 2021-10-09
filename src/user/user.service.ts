import { ForbiddenException, Injectable } from '@nestjs/common';
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

  async registerUser(
    intraUsername: string,
    email: string,
    nickname: string,
    imagePath: string,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const user = await queryRunner.manager
      .getRepository(User)
      .findOne({ where: { intraUsername } });
    if (user) {
      throw new ForbiddenException('이미 존재하는 사용자입니다.');
    }
    try {
      await queryRunner.manager.getRepository(User).save({
        intraUsername,
        email,
        nickname,
        imagePath,
        experience: 0,
        rank_id: 1,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
