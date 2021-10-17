import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { ChannelChat } from 'src/entities/ChannelChat';
import { ChannelMember } from 'src/entities/ChannelMember';
import { User } from 'src/entities/User';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelMember)
    private channelMemberRepository: Repository<ChannelMember>,
    @InjectRepository(ChannelChat)
    private channelChatRepository: Repository<ChannelChat>,
    private connection: Connection,
  ) {}

  async createChannel(
    name: string,
    ownerId: number,
    password: string,
    maxParticipantNum: number,
  ) {
    if (maxParticipantNum < 3 || maxParticipantNum > 100)
      throw new UnauthorizedException(
        '채팅방 생성 인원은 최소 3명 이상, 최대 100명 이하입니다.',
      );
    const existChatroom = await this.channelRepository.findOne({
      where: [{ name }],
    });
    if (existChatroom)
      throw new UnauthorizedException('이미 존재하는 채팅방 이름입니다.');

    const channel = new Channel();
    channel.name = name;
    if (password !== undefined) channel.password = password;
    channel.maxParticipantNum = maxParticipantNum;
    const channelReturned = await this.channelRepository.save(channel);
    const channelMember = new ChannelMember();
    channelMember.userId = ownerId;
    channelMember.channelId = channelReturned.channelId;
    await this.channelMemberRepository.save(channelMember);
    return channel;
  }
}
