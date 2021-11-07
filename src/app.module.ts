import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
// import { getConnectionOptions } from 'typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PassportModule } from '@nestjs/passport';
import AdminJS, { CurrentAdmin } from 'adminjs';
import { AdminModule } from '@adminjs/nestjs';
import { Database, Resource } from '@adminjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ScheduleModule } from '@nestjs/schedule';
// AdminModule을 AdminJS가 사용 하고 있기 때문에 다른 이름으로 가져옴
import { AdminModule as AdminUserModule } from './admin/admin.module';
import * as ormconfig from './ormconfig';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChannelModule } from './channel/channel.module';
import { EventsModule } from './events/events.module';
import { RelationModule } from './relation/relation.module';
import { Admin } from './entities/Admin';
import { DmModule } from './dm/dm.module';
import { User } from './entities/User';
import { Channel } from './entities/Channel';
import { GameModule } from './game/game.module';
import { ChannelChat } from './entities/ChannelChat';
import { ChannelMember } from './entities/ChannelMember';
import { Announcement } from './entities/Announcement';

AdminJS.registerAdapter({ Database, Resource });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await ormconfig, {
          autoLoadEntities: true,
          keepConnectionAlive: true,
          timezone: process.env.TZ,
        }),
    }),
    AdminModule.createAdminAsync({
      imports: [TypeOrmModule.forFeature([Admin])],
      inject: [getRepositoryToken(Admin)],

      useFactory: (adminRepository: Repository<Admin>) => ({
        adminJsOptions: {
          rootPath: '/admin',
          resources: [
            {
              resource: Admin,
              options: {
                properties: { encryptedPassword: { isVisible: false } },
                password: {
                  type: 'string',
                  isVisible: {
                    list: false,
                    edit: true,
                    filter: false,
                    show: false,
                  },
                },
              },
              actions: {
                new: {
                  before: async (request) => {
                    if (request.payload.password) {
                      request.payload = {
                        ...request.payload,
                        encryptedPassword: await bcrypt.hash(
                          request.payload.password,
                          process.env.BCRYPT_HASH_ROUNDS,
                        ),
                        password: undefined,
                      };
                    }
                    return request;
                  },
                },
              },
            },
            Announcement,
            User,
            Channel,
            ChannelMember,
            ChannelChat,
          ],
        },
        auth: {
          authenticate: async (email, password) => {
            const admin = await adminRepository
              .createQueryBuilder('admin')
              .where('admin.email = :email', { email })
              .addSelect('admin.password')
              .getOne();
            if (!admin) return false;
            const isValid = await bcrypt.compare(password, admin.password);
            if (!isValid) return false;

            return admin as unknown as CurrentAdmin;
          },
          cookieName: process.env.ADMIN_COOKIE_NAME,
          cookiePassword: process.env.ADMIN_COOKIE_PASSWORD,
        },
      }),
    } as any),
    MulterModule.register({
      dest: './profile_image',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'profile_image'),
      serveRoot: '/profile_image',
    }),
    ChannelModule,
    EventsModule,
    RelationModule,
    PassportModule,
    DmModule,
    ScheduleModule.forRoot(),
    // AdminModule을 AdminJS가 사용 하고 있기 때문에 다른 이름으로 가져옴
    AdminUserModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
