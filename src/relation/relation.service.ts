import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';

@Injectable()
export class RelationService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Block) private blockRepository: Repository<Block>,
  ) {}

  async blockUser(userId: number, blockUserId: number) {
    if (userId === blockUserId) {
      throw new BadRequestException('본인을 차단할 수 없습니다.');
    }

    const blockUser = await this.userRepository.findOne({
      userId: blockUserId,
    });
    if (!blockUser) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const previousBlockData = await this.blockRepository.findOne({
      userId,
      blockedUserId: blockUser.userId,
      isDeleted: false,
    });
    if (previousBlockData) {
      throw new BadRequestException('이미 차단된 회원입니다.');
    }

    const result = await this.blockRepository.save({
      userId,
      blockedUser: blockUser,
    });

    const { currentHashedRefreshToken, ...blockedUser } = result.blockedUser;
    return blockedUser;
  }

  async unblockUser(userId: number, unblockUserId: number) {
    if (userId === unblockUserId) {
      throw new BadRequestException(
        '본인을 차단할 수도, 차단 해제할 수도 없습니다.',
      );
    }

    const unblockUser = await this.userRepository.findOne({
      userId: unblockUserId,
    });
    if (!unblockUser) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const previousBlockData = await this.blockRepository.findOne({
      userId,
      blockedUserId: unblockUser.userId,
      isDeleted: false,
    });

    if (!previousBlockData) {
      throw new BadRequestException('차단된 기록이 없습니다.');
    }

    // TODO: softRemove 쓰는걸로 바꿔보자.
    // previousBlockData.isDeleted = true;  // 이게 적용이 안됨.
    // await this.blockRepository.softRemove(previousBlockData);
    previousBlockData.isDeleted = true;
    previousBlockData.deletedAt = new Date();
    await this.blockRepository.update(
      previousBlockData.blockId,
      previousBlockData,
    );

    const { currentHashedRefreshToken, ...unblockedUser } = unblockUser;
    return unblockedUser;
  }
}
