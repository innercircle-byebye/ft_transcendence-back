import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { ChannelChat } from 'src/entities/ChannelChat';
import { ChannelMember } from 'src/entities/ChannelMember';
import { User } from 'src/entities/User';
import { EventsGateway } from 'src/events/events.gateway';
import { Connection, Repository } from 'typeorm';

// TODO: 채널 조회시 비밀방 유무로 객체 전달
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
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getAllChannels() {
    const allChannelsWithPassword = await this.channelRepository
      .createQueryBuilder('channel')
      .addSelect('channel.password')
      .getMany();

    // TODO: 함수화, 재사용 가능하도록 처리
    const channelPasswordConverted = allChannelsWithPassword.map(
      (channelMemeber: any) => {
        if (channelMemeber.password === null)
          channelMemeber.isProtected = false;
        else channelMemeber.isProtected = true;
        delete channelMemeber.password;
        return channelMemeber;
      },
    );
    return channelPasswordConverted;
  }

  async getAllChannelsByUser(userId: number) {
    const joinedChannelMember = await this.channelMemberRepository
      .createQueryBuilder('channelMember')
      .where('channelMember.userId = :id', { id: userId })
      .innerJoinAndSelect('channelMember.channel', 'channel')
      .addSelect('channel.password')
      .getMany();

    const channelList = joinedChannelMember.map((channelMemeber: any) => {
      if (channelMemeber.channel.password === null)
        channelMemeber.channel.isProtected = false;
      else channelMemeber.channel.isProtected = true;
      delete channelMemeber.channel.password;
      return channelMemeber.channel;
    });

    return channelList;
  }

  getChannelInformation(name: string) {
    const thisChannel = this.channelRepository.findOne({
      where: { name },
    });
    if (!thisChannel)
      throw new BadRequestException('채팅방이 존재하지 않습니다.');
    return thisChannel;
  }

  async createChannel(
    name: string,
    ownerId: number,
    password: string,
    maxParticipantNum: number,
  ) {
    if (maxParticipantNum < 3 || maxParticipantNum > 100)
      throw new BadRequestException(
        '채팅방 생성 인원은 최소 3명 이상, 최대 100명 이하입니다.',
      );
    const existChatroom = await this.channelRepository.findOne({
      where: [{ name }],
    });
    if (existChatroom)
      throw new BadRequestException('이미 존재하는 채팅방 이름입니다.');

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
      .createQueryBuilder('channelMembers')
      .innerJoinAndSelect(
        'channelMembers.channel',
        'members',
        'members.name = :channelName',
        {
          channelName: name,
        },
      )
      .innerJoinAndSelect('channelMembers.user', 'user')
      .select(['channelMembers', 'user.nickname', 'user.imagePath'])
      .getMany();
  }

  async createChannelMember(name: string, userId: number, password: string) {
    console.log(userId);
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

  async getChannelChatsByChannelName(name: string) {
    console.log(name);
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    console.log(channelIdByName);
    if (!channelIdByName) {
      throw new BadRequestException('채널이 존재하지 않습니다.');
    }
    console.log(channelIdByName);
    const channelChats = this.channelChatRepository
      .createQueryBuilder('channelChats')
      .where('channelChats.channelId = :id', { id: channelIdByName.channelId })
      .innerJoinAndSelect('channelChats.user', 'user')
      .select(['channelChats', 'user.nickname', 'user.imagePath'])
      .getMany();

    return channelChats;
  }

  // TODO: 예외처리
  async createChannelChat(name: string, content: string, userId: number) {
    const targetChannel = await this.channelRepository.findOne({
      where: { name },
    });
    if (!targetChannel) {
      throw new BadRequestException('채널이 존재하지 않습니다.');
    }
    const chats = new ChannelChat();
    chats.content = content;
    chats.userId = userId;
    chats.channelId = targetChannel.channelId;
    const savedChat = await this.channelChatRepository.save(chats);
    const chatWithUser = await this.channelChatRepository.findOne({
      where: { channelChatId: savedChat.channelChatId },
      // relations: ['user', 'channel'],
    });
    console.log('hellow');

    this.eventsGateway.server
      .to(`channel-${name}`)
      .emit('message', chatWithUser);
  }
}
