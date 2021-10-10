import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { UserEntity } from '../entities/Users';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private connection: Connection,
  ) {}

  async postUser(nickname: string, profileImage: string) {
    console.log(nickname);
    console.log(profileImage);
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const user = await queryRunner.manager
      .getRepository(UserEntity)
      .findOne({ where: { nickname } });
    if (user) {
      return;
    }
    try {
      await queryRunner.manager.getRepository(UserEntity).save({
        nickname,
        profileImage,
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

  async getById(id: number) {
    const user = await this.userRepository.findOne({ id });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async getByIntraUsername(intraUsername: string): Promise<UserEntity> {
    return this.userRepository.findOne({ intraUsername });
  }

  async createNewUserByIntraInfo(intraInfo: any): Promise<UserEntity> {
    const { intraId, email, imageUrl } = intraInfo;

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let createdUser: UserEntity;
    try {
      createdUser = await queryRunner.manager.getRepository(UserEntity).save({
        intraUsername: intraId,
        nickname: intraId,
        email,
        profileImage: imageUrl,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return createdUser;
  }

  async setCurrentRefreshToken(refreshToken: string, id: number) {
    const currentHashedRefreshToken = await hash(refreshToken, 10);
    await this.userRepository.update(id, { currentHashedRefreshToken });
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, id: number) {
    const user = await this.getById(id);

    const isRefreshTokenMatching = await compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
    return null;
  }
}
