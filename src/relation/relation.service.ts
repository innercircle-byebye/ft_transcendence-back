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

    const previouslyBlockedUser = await this.blockRepository.findOne({
      userId,
      blockedUserId: blockUser.userId,
      isDeleted: false,
    });
    if (previouslyBlockedUser) {
      throw new BadRequestException('이미 차단된 회원입니다.');
    }

    const result = await this.blockRepository.save({
      userId,
      blockedUser: blockUser,
    });

    const { currentHashedRefreshToken, ...blockedUser } = result.blockedUser;
    return blockedUser;
  }
}
