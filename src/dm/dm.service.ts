import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DM, DMType } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { MainEventsGateway } from 'src/events/main-events.gateway';
import { onlineMap } from 'src/events/onlineMap';
import { In, MoreThan, Repository } from 'typeorm';

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DM) private dmRepository: Repository<DM>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly mainEventsGateway: MainEventsGateway,
  ) {}

  async getAllDMChats(userId: number, opponentId: number) {
    return this.dmRepository
      .createQueryBuilder('dm')
      .innerJoinAndSelect('dm.sender', 'sender')
      .innerJoinAndSelect('dm.receiver', 'receiver')
      .andWhere(
        '((dm.senderId = :userId AND dm.receiverId = :opponentId) OR (dm.receiverId = :userId AND dm.senderId = :opponentId))',
        { userId, opponentId },
      )
      .orderBy('dm.createdAt', 'DESC')
      .getMany();
  }

  async getDMChats(
    userId: number,
    opponentId: number,
    perPage: number,
    page: number,
  ) {
    return this.dmRepository
      .createQueryBuilder('dm')
      .innerJoinAndSelect('dm.sender', 'sender')
      .innerJoinAndSelect('dm.receiver', 'receiver')
      .andWhere(
        '((dm.senderId = :userId AND dm.receiverId = :opponentId) OR (dm.receiverId = :userId AND dm.senderId = :opponentId))',
        { userId, opponentId },
      )
      .orderBy('dm.createdAt', 'DESC')
      .take(perPage)
      .skip(perPage * (page - 1))
      .getMany();
  }

  async createDM(
    senderId: number,
    receiverId: number,
    content: string,
    type: DMType,
  ) {
    const receiver = await this.userRepository.findOne({ userId: receiverId });
    if (!receiver) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const savedDM = await this.dmRepository.save({
      senderId,
      receiverId,
      type,
      content,
    });
    const dmWithUsers = await this.dmRepository.findOne({
      where: { dmId: savedDM.dmId },
      relations: ['sender', 'receiver'],
    });

    const receiverSocketId = Object.keys(onlineMap).find(
      (key) => onlineMap[key] === receiverId,
    );
    this.mainEventsGateway.server.to(receiverSocketId).emit('dm', dmWithUsers);
  }

  async createDMs(
    senderId: number,
    receiverIds: number[],
    content: string,
    type: DMType,
  ) {
    const receivers = await this.userRepository.find({
      userId: In(receiverIds),
    });
    if (receivers.length !== receiverIds.length) {
      throw new BadRequestException('존재하지 않는 사용자가 포함되어있습니다.');
    }

    for (let i = 0; i < receiverIds.length; i += 1) {
      this.createDM(senderId, receiverIds[i], content, type);
    }
  }

  async getDMUnreadsCount(userId: number, senderId: number, after: number) {
    const sender = await this.userRepository.findOne({ userId: senderId });
    if (!sender) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    return this.dmRepository.count({
      where: {
        senderId,
        receiverId: userId,
        createdAt: MoreThan(new Date(after)),
      },
    });
  }

  async getAllDMUsers(userId: number) {
    const dms = await this.dmRepository
      .createQueryBuilder('dm')
      .innerJoinAndSelect('dm.sender', 'sender')
      .innerJoinAndSelect('dm.receiver', 'receiver')
      .andWhere('((dm.senderId = :userId) OR (dm.receiverId = :userId))', {
        userId,
      })
      .orderBy('dm.createdAt', 'DESC')
      .select()
      .getMany();

    const dmUsers = dms.map((dm) => {
      if (dm.senderId === userId) {
        return dm.receiver;
      }
      return dm.sender;
    });

    const uniqueDMUsers = [
      ...new Map(dmUsers.map((item) => [item.userId, item])).values(),
    ];

    return uniqueDMUsers;
  }
}
