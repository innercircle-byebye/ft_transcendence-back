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

    const channelPasswordConverted = await Promise.all(
      allChannelsWithPassword.map(async (channelList: any) => {
        if (channelList.password === null) channelList.isPrivate = false;
        else channelList.isPrivate = true;
        delete channelList.password;
        console.log(channelList.name);
        channelList.currentChatMemberCount =
          await this.getCurrentChannelMemberCount(channelList.name);
        return channelList;
      }),
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

    // TODO: 함수화, 재사용 가능하도록 처리
    const channelList = joinedChannelMember.map((channelMemeber: any) => {
      if (channelMemeber.channel.password === null)
        channelMemeber.channel.isPrivate = false;
      else channelMemeber.channel.isPrivate = true;
      delete channelMemeber.channel.password;
      return channelMemeber.channel;
    });

    return channelList;
  }

  async getChannelInformation(name: string) {
    const thisChannel: any = await this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.name= :name', { name })
      .addSelect('channel.password')
      .getOne();

    if (!thisChannel)
      throw new BadRequestException('존재하지 않는 채널입니다.');
    if (thisChannel.password === null) thisChannel.isPrivate = false;
    else thisChannel.isPrivate = true;
    delete thisChannel.password;
    thisChannel.currentChatMemberCount =
      await this.getCurrentChannelMemberCount(name);
    return thisChannel;
  }

  async createChannel(
    name: string,
    ownerId: number,
    password: string,
    maxParticipantNum: number,
    invitedUsers: number[],
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (maxParticipantNum < 3 || maxParticipantNum > 100)
      throw new BadRequestException(
        '채널 생성 인원은 최소 3명 이상, 최대 100명 이하입니다.',
      );
    const existChatroom = await this.channelRepository.findOne({
      where: [{ name }],
    });
    if (existChatroom)
      throw new BadRequestException('이미 존재하는 채널 이름입니다.');

    let channelReturned;
    try {
      const channel = new Channel();
      channel.name = name;
      channel.ownerId = ownerId;
      if (password) channel.password = password;
      channel.maxParticipantNum = maxParticipantNum;
      channelReturned = await queryRunner.manager
        .getRepository(Channel)
        .save(channel);
      const channelMember = new ChannelMember();
      channelMember.userId = ownerId;
      channelMember.channelId = channelReturned.channelId;
      channelMember.isAdmin = true;
      await queryRunner.manager
        .getRepository(ChannelMember)
        .save(channelMember);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // TODO: DM으로 해당 유저 초대 메시지 보내기
    // for(variinarray){
    //    output += array[i];
    // }

    if (invitedUsers && invitedUsers.length > 0) console.log(invitedUsers);
    return channelReturned;
  }

  async updateChannel(
    name: string,
    adminId: number,
    updatedName: string,
    password: string,
    maxParticipantNum: number,
  ) {
    const targetChatroom = await this.channelRepository.findOne({
      where: [{ name }],
    });
    if (!targetChatroom)
      throw new BadRequestException('존재 하지 않는 채널입니다.');

    if (maxParticipantNum < 3 || maxParticipantNum > 100)
      throw new BadRequestException(
        '채널 생성 인원은 최소 3명 이상, 최대 100명 이하입니다.',
      );
    if (name !== updatedName) {
      const existChatroom = await this.channelRepository.findOne({
        where: [{ name: updatedName }],
      });
      if (existChatroom)
        throw new BadRequestException('이미 존재하는 채널 이름입니다.');
    }
    const channelAdmin = await this.channelMemberRepository
      .createQueryBuilder('channelMember')
      .where('channelMember.user_id = :adminId', { adminId })
      .andWhere('channelMember.channel_id = :channelId', {
        channelId: targetChatroom.channelId,
      })
      .getOne();

    if (!channelAdmin || channelAdmin.isAdmin === false)
      throw new BadRequestException('채널 수정 권한이 없습니다.');

    if (password) targetChatroom.password = password;
    if (targetChatroom.maxParticipantNum !== maxParticipantNum)
      targetChatroom.maxParticipantNum = maxParticipantNum;
    if (name !== updatedName) targetChatroom.name = updatedName;
    return this.channelRepository.save(targetChatroom);
  }

  async deleteChannel(name: string, ownerId: number) {
    const targetChatroom = await this.channelRepository.findOne({
      where: [{ name }],
    });
    if (!targetChatroom)
      throw new BadRequestException('존재하지 않는 채널입니다.');
    if (targetChatroom.ownerId !== ownerId)
      throw new BadRequestException('채널 삭제 권한이 없습니다.');
    return this.channelRepository.softRemove(targetChatroom);
  }

  async getChannelMembers(name: string) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName)
      throw new BadRequestException('존재 하지 않는 채널입니다.');
    return this.channelMemberRepository
      .createQueryBuilder('channelMembers')
      .innerJoin(
        'channelMembers.channel',
        'channel',
        'channel.name = :channelName',
        {
          channelName: name,
        },
      )
      .innerJoinAndSelect('channelMembers.user', 'user')
      .select(['channelMembers', 'user.nickname', 'user.imagePath'])
      .getMany();
  }

  async getCurrentChannelMemberCount(name: string) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName)
      throw new BadRequestException('존재 하지 않는 채널입니다.');
    return this.channelMemberRepository
      .createQueryBuilder('channelMembers')
      .innerJoin(
        'channelMembers.channel',
        'channel',
        'channel.name = :channelName',
        {
          channelName: name,
        },
      )
      .innerJoinAndSelect('channelMembers.user', 'user')
      .select(['channelMembers', 'user.nickname', 'user.imagePath'])
      .getCount();
  }

  async createChannelMember(
    name: string,
    userId: number,
    targetUserId: number,
    password: string,
  ) {
    const channel = await this.channelRepository.findOne({ where: { name } });
    if (!channel) {
      throw new BadRequestException('존재하지 않는 채널입니다.');
    }
    if (channel.password !== password)
      throw new BadRequestException('잘못된 비밀번호입니다.');
    const user = await this.userRepository.findOne({
      where: { userId: targetUserId || userId },
    });
    if (!user) {
      throw new BadRequestException('존재하지 않는 사용자입니다.');
    }
    const currentChatMemberCount = await this.getCurrentChannelMemberCount(
      name,
    );
    if (channel.maxParticipantNum <= currentChatMemberCount)
      throw new BadRequestException('채널 정원 초과입니다.');
    // 나간 사용자가 다시 들어오고 싶을 때
    const targetUser = await this.channelMemberRepository
      .createQueryBuilder('channelMembers')
      .where('channelMembers.channelId = :channelId', {
        channelId: channel.channelId,
      })
      .andWhere('channelMembers.userId = :target', {
        target: targetUserId || userId,
      })
      .withDeleted()
      .getOne();
    if (targetUser) {
      return this.channelMemberRepository.recover(targetUser);
    }
    // 나간 사용자가 다시 들어오고 싶을 때
    const channelMember = new ChannelMember();
    channelMember.channelId = channel.channelId;
    channelMember.userId = user.userId;
    return this.channelMemberRepository.save(channelMember);
  }

  async deleteChannelMember(
    name: string,
    userId: number,
    targetUserId: number,
  ) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName)
      throw new BadRequestException('존재 하지 않는 채널입니다.');
    const targetUser = await this.channelMemberRepository
      .createQueryBuilder('channelMembers')
      .where('channelMembers.channelId = :channelId', {
        channelId: channelIdByName.channelId,
      })
      .andWhere('channelMembers.userId = :target', {
        target: targetUserId || userId,
      })
      .getOne();
    if (!targetUser)
      throw new BadRequestException('채널에 유저가 존재하지 않습니다.');

    return this.channelMemberRepository.softRemove(targetUser);
  }

  async updateChannelMember(
    name: string,
    userId: number,
    targetUserId: number,
    banDate: Date,
    mutedDate: Date | null,
    isAdmin: boolean,
  ) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName)
      throw new BadRequestException('존재 하지 않는 채널입니다.');
    const targetUser = await this.channelMemberRepository
      .createQueryBuilder('channelMembers')
      .where('channelMembers.channelId = :channelId', {
        channelId: channelIdByName.channelId,
      })
      .andWhere('channelMembers.userId = :target', {
        target: targetUserId || userId,
      })
      .getOne();
    if (!targetUser)
      throw new BadRequestException('존재 하지 않는 사용자입니다.');

    targetUser.mutedDate = mutedDate;
    targetUser.isAdmin = isAdmin;
    if (banDate) {
      targetUser.banDate = banDate;
      return this.channelChatRepository.softRemove(targetUser);
    }
    return this.channelMemberRepository.save(targetUser);
  }

  async getChannelChatsByChannelName(name: string) {
    const channelIdByName = await this.channelRepository.findOne({
      where: { name },
    });
    if (!channelIdByName) {
      throw new BadRequestException('존재하지 않는 채널입니다.');
    }
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
      throw new BadRequestException('존재하지 않는 채널입니다.');
    }
    const chats = new ChannelChat();
    chats.content = content;
    chats.userId = userId;
    chats.channelId = targetChannel.channelId;
    const savedChat = await this.channelChatRepository.save(chats);

    const chatWithUser = this.channelChatRepository
      .createQueryBuilder('channelChats')
      .where('channelChats.channelChatId = :id', {
        id: savedChat.channelChatId,
      })
      .innerJoinAndSelect('channelChats.user', 'user')
      .select(['channelChats', 'user.nickname', 'user.imagePath'])
      .getOne();

    this.eventsGateway.server
      .to(`channel-${name}`)
      .emit('message', chatWithUser);

    return chatWithUser;
  }
}
