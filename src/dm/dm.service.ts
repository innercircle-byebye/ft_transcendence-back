import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DM } from 'src/entities/DM';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';

/*
function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}
*/

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DM) private dmRepository: Repository<DM>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createDMChats(senderId: number, receiverId: number, content: string) {
    const savedDM = await this.dmRepository.save({
      senderId,
      receiverId,
      content,
    });
    const dmWithUsers = await this.dmRepository.findOne({
      where: { dmId: savedDM.dmId },
      relations: ['sender', 'receiver'],
    });
    console.log('----------------------------------------------------');
    console.log(dmWithUsers);
    console.log('----------------------------------------------------');
    /*
    const receiverSocketId = getKeyByValue(
      onlineMap['/chat'],
      Number(receiverId),
    );
    this.eventGateway.server.to(receiverSocketId).emit('dm', dmWithUsers);
    */
  }
}
