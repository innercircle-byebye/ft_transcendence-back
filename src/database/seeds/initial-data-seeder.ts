import { Friend } from 'src/entities/Friend';
import { User } from 'src/entities/User';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';
import { friendInitData } from '../friend-init-data';
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

    // Friend
    await connection
      .createQueryBuilder()
      .insert()
      .into(Friend)
      .values(friendInitData)
      .execute();

    // Announcement
    // await connection
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Announcement)
    //   .values(announcementInitData)
    //   .execute();
  }
}
