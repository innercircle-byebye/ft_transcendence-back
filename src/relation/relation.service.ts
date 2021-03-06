import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { Friend, FriendStatus } from 'src/entities/Friend';
import { User } from 'src/entities/User';
import { Brackets, Repository } from 'typeorm';

@Injectable()
export class RelationService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Block) private blockRepository: Repository<Block>,
    @InjectRepository(Friend) private friendRepository: Repository<Friend>,
  ) {}

  async getBlockedUserList(userId: number) {
    const result = await this.blockRepository
      .createQueryBuilder('block')
      .where('block.userId = :userId', { userId })
      .innerJoinAndSelect('block.blockedUser', 'blockedUser')
      .getMany();

    const blockedUserList = result.map((block) => {
      const { currentHashedRefreshToken, ...blockedUser } = block.blockedUser;
      return blockedUser;
    });
    return blockedUserList;
  }

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
    });
    if (previousBlockData) {
      throw new BadRequestException('이미 차단된 회원입니다.');
    }

    const result = await this.blockRepository.save({
      userId,
      blockedUser: blockUser,
    });

    delete result.blockedUser.currentHashedRefreshToken;
    return result.blockedUser;
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
    });

    if (!previousBlockData) {
      throw new BadRequestException('차단된 기록이 없습니다.');
    }

    await this.blockRepository.softRemove(previousBlockData);

    delete unblockUser.currentHashedRefreshToken;
    return unblockUser;
  }

  async getFriendUserList(userId: number) {
    const result = await this.friendRepository
      .createQueryBuilder('friend')
      .where(
        new Brackets((qb) => {
          qb.where('friend.requesterId = :userId', { userId }).orWhere(
            'friend.respondentId = :userId',
            { userId },
          );
        }),
      )
      .andWhere('friend.status = :status', { status: FriendStatus.APPROVE })
      .innerJoinAndSelect('friend.requester', 'requester')
      .innerJoinAndSelect('friend.respondent', 'respondent')
      .getMany();

    const friendUserList = result.map((friend) => {
      if (friend.requester.userId === userId) {
        const { currentHashedRefreshToken, ...friendUser } = friend.respondent;
        return friendUser;
      }
      const { currentHashedRefreshToken, ...friendUser } = friend.requester;
      return friendUser;
    });

    return friendUserList;
  }

  async getNewFriendRequestUserList(userId: number) {
    const result = await this.friendRepository
      .createQueryBuilder('friend')
      .where('friend.respondentId = :userId', { userId })
      .andWhere('friend.status = :status', { status: FriendStatus.WAIT })
      .innerJoinAndSelect('friend.requester', 'requester')
      .getMany();

    const newFriendRequestUserList = result.map((friend) => {
      const { currentHashedRefreshToken, ...newFriendRequestUser } =
        friend.requester;
      return newFriendRequestUser;
    });

    return newFriendRequestUserList;
  }

  async getWaitFriendRequestUserList(userId: number) {
    const result = await this.friendRepository
      .createQueryBuilder('friend')
      .where('friend.requesterId = :userId', { userId })
      .andWhere('friend.status = :status', { status: FriendStatus.WAIT })
      .innerJoinAndSelect('friend.respondent', 'respondent')
      .getMany();

    const waitFriendRequestUserList = result.map((friend) => {
      const { currentHashedRefreshToken, ...waitFriendRequestUser } =
        friend.respondent;
      return waitFriendRequestUser;
    });

    return waitFriendRequestUserList;
  }

  async requestFriendRelation(requester: User, respondentId: number) {
    if (requester.userId === respondentId) {
      throw new BadRequestException('본인에게 친구 요청할 수 없습니다.');
    }

    const respondent: User = await this.userRepository.findOne(respondentId);
    if (!respondent) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const previousFriendData: Friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: requester.userId,
          respondentId: respondent.userId,
        },
        {
          requesterId: respondent.userId,
          respondentId: requester.userId,
        },
      ],
    });

    if (previousFriendData) {
      if (previousFriendData.status === FriendStatus.APPROVE) {
        throw new BadRequestException('이미 친구관계 입니다.');
      }
      if (previousFriendData.status === FriendStatus.WAIT) {
        if (previousFriendData.requesterId === requester.userId) {
          throw new BadRequestException('현재 친구 요청 대기 중입니다.');
        }
        if (previousFriendData.requesterId === respondent.userId) {
          throw new BadRequestException(
            '해당 사용자로부터 들어온 친구 요청이 존재합니다.',
          );
        }
      }
      if (
        previousFriendData.status === FriendStatus.REJECT &&
        previousFriendData.requesterId === requester.userId
      ) {
        const now = new Date();
        const refuseEndDate = new Date(
          previousFriendData.lastModifiedAt.getTime(),
        );
        refuseEndDate.setDate(refuseEndDate.getDate() + 7);

        if (now < refuseEndDate) {
          let remainSecond = Math.floor(
            (refuseEndDate.getTime() - now.getTime()) / 1000,
          );
          const remainDay = Math.floor(remainSecond / (24 * 60 * 60));
          remainSecond -= remainDay * (24 * 60 * 60);
          const remainHour = Math.floor(remainSecond / (60 * 60));
          remainSecond -= remainHour * (60 * 60);
          const remainMinute = Math.floor(remainSecond / 60);
          remainSecond -= remainMinute * 60;
          throw new BadRequestException(
            `친구 요청이 거절된 기록이 있습니다. ${remainDay}일 ${remainHour}시간 ${remainMinute}분 ${remainSecond}초 뒤에 친구 요청이 가능합니다.`,
          );
        }
      }
    }

    const result = await this.friendRepository.manager.transaction(
      async (em) => {
        if (previousFriendData?.status === FriendStatus.REJECT) {
          await em.softRemove(Friend, previousFriendData);
        }
        return em.save(Friend, {
          requester,
          respondent,
          status: FriendStatus.WAIT,
        });
      },
    );

    delete result.respondent.currentHashedRefreshToken;
    return result.respondent;
  }

  async cancelFriendRequest(requester: User, respondentId: number) {
    if (requester.userId === respondentId) {
      throw new BadRequestException(
        '본인에게 친구 요청할 수도 요청 취소할 수도 없습니다.',
      );
    }

    const respondent: User = await this.userRepository.findOne(respondentId);
    if (!respondent) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const friendRequestData: Friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: requester.userId,
          respondentId: respondent.userId,
          status: FriendStatus.WAIT,
        },
      ],
    });
    if (!friendRequestData) {
      throw new BadRequestException('취소할 친구 요청이 없습니다.');
    }

    await this.friendRepository.softRemove(friendRequestData);

    delete respondent.currentHashedRefreshToken;
    return respondent;
  }

  async approveFriendRequest(respondent: User, requesterId: number) {
    if (respondent.userId === requesterId) {
      throw new BadRequestException('본인에게 친구요청 승인을 할 수 없습니다.');
    }

    const requester: User = await this.userRepository.findOne(requesterId);
    if (!requester) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const friendRequestData: Friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: requester.userId,
          respondentId: respondent.userId,
          status: FriendStatus.WAIT,
        },
      ],
    });
    if (!friendRequestData) {
      throw new BadRequestException('승인할 친구 요청이 없습니다.');
    }

    friendRequestData.status = FriendStatus.APPROVE;
    await this.friendRepository.save(friendRequestData);

    delete requester.currentHashedRefreshToken;
    return requester;
  }

  async rejectFriendRequest(respondent: User, requesterId: number) {
    if (respondent.userId === requesterId) {
      throw new BadRequestException(
        '본인에게 친구 요청받을 수도, 거절할 수도 없습니다.',
      );
    }

    const requester: User = await this.userRepository.findOne(requesterId);
    if (!requester) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const friendRequestData: Friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: requester.userId,
          respondentId: respondent.userId,
          status: FriendStatus.WAIT,
        },
      ],
    });
    if (!friendRequestData) {
      throw new BadRequestException('거절할 친구 요청이 없습니다.');
    }

    friendRequestData.status = FriendStatus.REJECT;
    await this.friendRepository.save(friendRequestData);

    delete requester.currentHashedRefreshToken;
    return requester;
  }

  async deleteFriend(user: User, targetUserId: number) {
    if (user.userId === targetUserId) {
      throw new BadRequestException(
        '혼자 친구관계를 만들 수도 삭제할 수도 없습니다.',
      );
    }

    const targetUser: User = await this.userRepository.findOne(targetUserId);
    if (!targetUser) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const friendRequestData: Friend = await this.friendRepository.findOne({
      where: [
        {
          requesterId: user.userId,
          respondentId: targetUser.userId,
          status: FriendStatus.APPROVE,
        },
        {
          requesterId: targetUser.userId,
          respondentId: user.userId,
          status: FriendStatus.APPROVE,
        },
      ],
    });
    if (!friendRequestData) {
      throw new BadRequestException('삭제할 친구 관계가 없습니다.');
    }

    await this.friendRepository.softRemove(friendRequestData);

    delete targetUser.currentHashedRefreshToken;
    return targetUser;
  }
}
