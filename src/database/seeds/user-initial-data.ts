import { User, UserStatus } from 'src/entities/User';
import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

export class UserInitialData implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          email: 'temp1@temp.com',
          nickname: '예시_1',
          intraUsername: 'temp_intra_1',
          imagePath: 'temp_path_1',
          status: UserStatus.OFFLINE,
          experience: 0,
          rankId: 1,
        },
        {
          email: 'temp2@temp.com',
          nickname: '예시_2',
          intraUsername: 'temp_intra_2',
          imagePath: 'temp_path_2',
          status: UserStatus.OFFLINE,
          experience: 0,
          rankId: 1,
        },
        {
          email: 'temp3@temp.com',
          nickname: '예시_3',
          intraUsername: 'temp_intra_3',
          imagePath: 'temp_path_3',
          status: UserStatus.OFFLINE,
          experience: 0,
          rankId: 1,
        },
        {
          email: 'temp4@temp.com',
          nickname: '예시_4',
          intraUsername: 'temp_intra_4',
          imagePath: 'temp_path_4',
          status: UserStatus.OFFLINE,
          experience: 0,
          rankId: 1,
        },
        {
          email: 'temp5@temp.com',
          nickname: '예시_5',
          intraUsername: 'temp_intra_5',
          imagePath: 'temp_path_5',
          status: UserStatus.OFFLINE,
          experience: 0,
          rankId: 1,
        },
      ])
      .execute();
  }
}
