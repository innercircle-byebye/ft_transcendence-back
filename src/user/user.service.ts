import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { User, UserStatus } from 'src/entities/User';
import { UpdateUserDto } from './dto/update.user.dto';

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

  // TODO: refactor
  async updateUser(userId: number, updateInfo: UpdateUserDto) {
    const {
      nickname,
      email,
      imagePath,
      status,
      isHistoryPublic,
      isStatusPublic,
      experience,
      rankId,
      banDate,
    } = updateInfo;
    const targetUser = await this.userRepository.findOne({ where: { userId } });
    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }
    if (targetUser.nickname !== nickname) targetUser.nickname = nickname;
    if (targetUser.status !== status) targetUser.status = status;
    if (targetUser.email !== email) targetUser.email = email;
    if (targetUser.imagePath !== imagePath) targetUser.imagePath = imagePath;
    if (targetUser.isHistoryPublic !== isHistoryPublic)
      targetUser.isHistoryPublic = isHistoryPublic;
    if (targetUser.isStatusPublic !== isStatusPublic)
      targetUser.isStatusPublic = isStatusPublic;
    if (targetUser.experience !== experience)
      targetUser.experience = experience;
    if (targetUser.rankId !== rankId) targetUser.rankId = rankId;
    if (targetUser.banDate !== banDate) targetUser.banDate = banDate;
    await this.userRepository.save(targetUser);
    return targetUser;
  }

  async registerUser(
    userId: number,
    email: string,
    nickname: string,
    imagePath: string,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // const duplicateIntra = await queryRunner.manager
    //   .getRepository(User)
    //   .findOne({ where: [{ userId }] });
    // if (duplicateIntra) {
    //   throw new UnauthorizedException(
    //     '이미 존재하는 사용자입니다. (인트라 ID 확인)',
    //   );
    // }
    // const duplicateEmail = await queryRunner.manager
    //   .getRepository(User)
    //   .findOne({ where: [{ email }] });
    // if (duplicateEmail) {
    //   throw new UnauthorizedException(
    //     '이미 존재하는 사용자입니다. (이메일 확인)',
    //   );
    // }
    let createdUser;
    try {
      const foundUser = await queryRunner.manager
        .getRepository(User)
        .findOne({ where: [{ userId }] });
      if (foundUser.imagePath !== imagePath) foundUser.imagePath = imagePath;
      if (foundUser.nickname !== nickname) foundUser.nickname = nickname;
      if (foundUser.email !== email) foundUser.email = email;
      foundUser.status = UserStatus.ONLINE;
      createdUser = await queryRunner.manager
        .getRepository(User)
        .save(foundUser);
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

  async restoreDeletedUser(userId: number) {
    console.log(`user id:${userId}`);
    const targetUser = await this.userRepository.findOne({ where: { userId } });
    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }
    return this.userRepository.restore(targetUser);
  }

  async getById(id: number) {
    const user = await this.userRepository.findOne({ userId: id });
    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this id does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async getByIntraUsername(intraUsername: string): Promise<User> {
    return this.userRepository.findOne({ intraUsername });
  }

  async getByNickName(nickname: string): Promise<User> {
    return this.userRepository.findOne({ nickname });
  }

  async createNewUserByIntraInfo(intraInfo: any): Promise<User> {
    // console.log(intraInfo);
    const { intraId, email, imageUrl } = intraInfo;

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let createdUser: User;
    try {
      createdUser = await queryRunner.manager.getRepository(User).save({
        intraUsername: intraId,
        nickname: intraId,
        email,
        status: UserStatus.NOT_REGISTERED,
        imagePath: imageUrl,
        experience: 42,
        rankId: 1,
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

  async setCurrentRefreshToken(refreshToken: string, user: User) {
    const currentHashedRefreshToken = await hash(refreshToken, 10);
    const { userId, status } = user;
    await this.userRepository.update(userId, {
      status: status !== UserStatus.NOT_REGISTERED ? UserStatus.ONLINE : status,
      currentHashedRefreshToken,
    });
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

  async removeRefreshToken(id: number, status: UserStatus) {
    return this.userRepository.update(id, {
      status:
        status !== UserStatus.NOT_REGISTERED ? UserStatus.OFFLINE : status,
      currentHashedRefreshToken: null,
    });
  }

  async setTwoFactorAuthSecret(userId: number, secret: string) {
    return this.userRepository.update(userId, {
      twoFactorAuthSecret: secret,
    });
  }

  async onAndOffTwoFactorAuthentication(userId: number, isTurnOn: boolean) {
    return this.userRepository.update(userId, {
      isTwoFactorAuthEnabled: isTurnOn,
    });
  }
}
