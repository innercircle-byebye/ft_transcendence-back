import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { Friend, FriendStatus } from 'src/entities/Friend';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';

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

  // - 내 친구 목록 조회하기
  // - 나한테 새로 들어온 친구 목록 조회하기
  // - 내가 대기중인 친구 목록 조회하기

  // - 친구 요청하기
  async friendRequest(requester: User, respondentId: number) {
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

  //   - 친구 요청 취소하기
  async friendRequestCancel(requester: User, respondentId: number) {
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

  //   - 친구 요청 승인하기
  async friendRequestApprove(respondent: User, requesterId: number) {
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

  //   - 친구 요청 거절하기(내가 거절하면 상대방은 일주일동안 친구신청 다시 못한다.)
  async friendRequestReject(respondent: User, requesterId: number) {
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

  //   - 친구 관계 삭제하기
}
