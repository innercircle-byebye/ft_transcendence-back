import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

  async getChannelMembers(name: string) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName)
      throw new BadRequestException('존재하지 않는 채널입니다.');
    return this.channelMemberRepository
      .createQueryBuilder('channelmembers')
      .innerJoin(
        'channelmembers.channel',
        'members',
        'members.channelId= :name',
        {
          name: channelIdByName.channelId,
        },
      )
      .getMany();
  }

  async createChannelMember(name: string, userId: number, password: string) {
    const channel = await this.channelRepository.findOne({ where: { name } });
    if (!channel) {
      throw new BadRequestException('채널이 존재하지 않습니다.');
    }
    if (channel.password !== password)
      throw new BadRequestException('잘못된 비밀번호입니다');
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new BadRequestException('존재하지 않는 사용자입니다');
    }
    // TOOD: 이미 참여중인 방입니다, 채널 정원 초과입니다.
    const currentChatMemberCount = await this.getChannelMembers(name);
    console.log(Object.keys(currentChatMemberCount).length);
    const channelMember = new ChannelMember();
    channelMember.channelId = channel.channelId;
    channelMember.userId = user.userId;
    return this.channelMemberRepository.save(channelMember);
  }

  async createChannelChat(name: string, content: string, userId: number) {
    const targetChannel = await this.channelRepository.findOne({
      where: { name },
    });
    const chats = new ChannelChat();
    chats.content = content;
  }
}
