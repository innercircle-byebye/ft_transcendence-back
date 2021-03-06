import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Block } from 'src/entities/Block';
import { Channel } from 'src/entities/Channel';
import { ChannelChat } from 'src/entities/ChannelChat';
import { ChannelMember } from 'src/entities/ChannelMember';
import { Friend } from 'src/entities/Friend';
// import { GameMember } from 'src/entities/GameMember';
// import { GameResult } from 'src/entities/GameResult';
// import { GameRoom } from 'src/entities/GameRoom';
import { Rank } from 'src/entities/Rank';
import { User } from 'src/entities/User';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { adminInitData } from '../admin-init-data';
import { announcementInitData } from '../announcement-init-data';
import { blockInitData } from '../block-init-data';
import { ChannelInitData } from '../channel-init-data';
import { ChannelChatInitData } from '../channelchat-init-data';
import { ChannelMemberInitData } from '../channelmember-init-data';
import { friendInitData } from '../friend-init-data';
// import {
//   GameMemberInitData,
//   GameResultInitData,
//   GameRoomInitData,
// } from '../game-init-data';
import { rankInitData } from '../rank-init-data';
import { userInitData } from '../user-init-data';

export class InitialDataSeeder implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    // User
    await connection
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(userInitData)
      .execute();

    await connection
      .createQueryBuilder()
      .insert()
      .into(Rank)
      .values(rankInitData)
      .execute();

    // Friend
    await connection
      .createQueryBuilder()
      .insert()
      .into(Friend)
      .values(friendInitData)
      .execute();

    // blocked user
    await connection
      .createQueryBuilder()
      .insert()
      .into(Block)
      .values(blockInitData)
      .execute();

    await connection
      .createQueryBuilder()
      .insert()
      .into(Admin)
      .values(adminInitData)
      .execute();

    // Announcement
    await connection
      .createQueryBuilder()
      .insert()
      .into(Announcement)
      .values(announcementInitData)
      .execute();

    // Channel
    await connection
      .createQueryBuilder()
      .insert()
      .into(Channel)
      .values(ChannelInitData)
      .execute();

    // ChannelMember
    await connection
      .createQueryBuilder()
      .insert()
      .into(ChannelMember)
      .values(ChannelMemberInitData)
      .execute();

    // ChannelChat
    await connection
      .createQueryBuilder()
      .insert()
      .into(ChannelChat)
      .values(ChannelChatInitData)
      .execute();

    // await connection
    //   .createQueryBuilder()
    //   .insert()
    //   .into(GameRoom)
    //   .values(GameRoomInitData)
    //   .execute();

    // await connection
    //   .createQueryBuilder()
    //   .insert()
    //   .into(GameMember)
    //   .values(GameMemberInitData)
    //   .execute();

    // await connection
    //   .createQueryBuilder()
    //   .insert()
    //   .into(GameResult)
    //   .values(GameResultInitData)
    //   .execute();
  }
}
