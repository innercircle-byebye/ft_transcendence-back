import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DM } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { EventsGateway } from 'src/events/events.gateway';
import { onlineMap } from 'src/events/onlineMap';
import { MoreThan, Repository } from 'typeorm';

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DM) private dmRepository: Repository<DM>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly eventGateway: EventsGateway,
  ) {}

  async getAllDMChats(userId: number, opponentId: number) {
    return this.dmRepository
      .createQueryBuilder('dm')
      .innerJoinAndSelect('dm.sender', 'sender')
      .innerJoinAndSelect('dm.receiver', 'receiver')
      .andWhere(
        '((dm.senderId = :userId AND dm.receiverId = :opponentId) OR (dm.receiverId = :opponentId AND dm.senderId = :userId))',
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
        '((dm.senderId = :userId AND dm.receiverId = :opponentId) OR (dm.receiverId = :opponentId AND dm.senderId = :userId))',
        { userId, opponentId },
      )
      .orderBy('dm.createdAt', 'DESC')
      .take(perPage)
      .skip(perPage * (page - 1))
      .getMany();
  }

  async createDMChats(senderId: number, receiverId: number, content: string) {
    const receiver = await this.userRepository.findOne({ userId: receiverId });
    if (!receiver) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }

    const savedDM = await this.dmRepository.save({
      senderId,
      receiverId,
      content,
    });
    const dmWithUsers = await this.dmRepository.findOne({
      where: { dmId: savedDM.dmId },
      relations: ['sender', 'receiver'],
    });

    const receiverSocketId = getKeyByValue(
      onlineMap['/chat'],
      Number(receiverId),
    );
    this.eventGateway.server.to(receiverSocketId).emit('dm', dmWithUsers);
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
}
