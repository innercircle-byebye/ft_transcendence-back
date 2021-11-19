import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { hash, compare } from 'bcryptjs';
import { User, UserStatus } from 'src/entities/User';
import * as fs from 'fs';
import { Rank } from 'src/entities/Rank';
import { UpdateUserDto } from './dto/update.user.dto';
import { UpdateUserVersionTwoDto } from './dto/update.user-v2.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Rank)
    private rankRepository: Repository<Rank>,
    private connection: Connection,
  ) {}

  getAllUsers() {
    return this.userRepository.find();
  }

  async getUser(userId: number) {
    const targetUser: any = await this.userRepository
      .createQueryBuilder('user')
      .where('user.userId = :userId', { userId })
      .getOne();

    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }

    targetUser.rankInfo = await this.rankRepository
      .createQueryBuilder('rank')
      .where('rank.criteriaExperience <= :experience', {
        experience: targetUser.experience,
      })
      .orderBy('rank.criteriaExperience', 'DESC')
      .limit(1)
      .getOne();
    // console.log(targetUser.rankInfo);

    delete targetUser.rankInfo.criteriaExperience;
    delete targetUser.rankInfo.rankId;

    return targetUser;
  }

  async getUserByNickname(nickname: string) {
    const targetUser: any = await this.userRepository
      .createQueryBuilder('user')
      .where('user.nickname = :nickname', { nickname })
      .getOne();

    if (!targetUser) {
      // 이미 삭제 처리가 되어 있는 경우
      throw new ForbiddenException('존재하지 않는 사용자입니다');
    }

    targetUser.rankInfo = await this.rankRepository
      .createQueryBuilder('rank')
      .where('rank.criteriaExperience <= :experience', {
        experience: targetUser.experience,
      })
      .orderBy('rank.criteriaExperience', 'DESC')
      .limit(1)
      .getOne();

    delete targetUser.rankInfo.criteriaExperience;
    delete targetUser.rankInfo.rankId;

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
      // rankId,
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
    // if (targetUser.rankId !== rankId) targetUser.rankId = rankId;
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

  async updateProfileImagePath(userId: number, filePath: string) {
    this.userRepository.update(userId, {
      imagePath: filePath,
    });
    return this.userRepository.find({ where: { userId } });
  }

  async removeExistingImagePath(userId: number): Promise<void> {
    const userInfo = await this.userRepository.findOne({ where: { userId } });
    const serverPath = userInfo.imagePath.substring(
      userInfo.imagePath.indexOf('/image/profile'),
      userInfo.imagePath.length,
    );

    if (fs.existsSync(`.${serverPath}`)) {
      fs.unlink(`.${serverPath}`, () => {
        // console.log('file deleted');
      });
    }
  }

  async updateUserProfileV2(userId: number, formData: UpdateUserVersionTwoDto) {
    const {
      nickname,
      email,
      isHistoryPublic,
      isStatusPublic,
      isTwoFactorAuthEnabled,
    } = formData;

    if (email) {
      const checkDuplicateEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (checkDuplicateEmail && checkDuplicateEmail.userId !== userId)
        throw new BadRequestException('동일한 이메일이 존재합니다.');
    }

    if (nickname) {
      const checkDuplicateNickname = await this.userRepository.findOne({
        where: { nickname },
      });
      if (checkDuplicateNickname && checkDuplicateNickname.userId !== userId)
        throw new BadRequestException('동일한 닉네임이 존재합니다.');
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let createdUser;
    try {
      const foundUser = await queryRunner.manager
        .getRepository(User)
        .findOne({ where: [{ userId }] });
      if (foundUser.nickname !== nickname) foundUser.nickname = nickname;
      if (foundUser.email !== email) foundUser.email = email;
      if (isHistoryPublic) {
        if (isHistoryPublic.toString() === 'true')
          foundUser.isHistoryPublic = true;
        else foundUser.isHistoryPublic = false;
      }
      if (isStatusPublic) {
        if (isStatusPublic.toString() === 'true')
          foundUser.isStatusPublic = true;
        else foundUser.isStatusPublic = false;
      }
      if (isTwoFactorAuthEnabled) {
        if (isTwoFactorAuthEnabled.toString() === 'true')
          foundUser.isTwoFactorAuthEnabled = true;
        else foundUser.isTwoFactorAuthEnabled = false;
      }
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
}
