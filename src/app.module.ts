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
import * as ormconfig from './ormconfig';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChannelModule } from './channel/channel.module';
import { EventsModule } from './events/events.module';
import { RelationModule } from './relation/relation.module';
import { Admin } from './entities/Admin';

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
      adminBroOptions: {
        rootPath: '/admin',
        resources: [Admin],
      },
      useFactory: (userRepository: Repository<Admin>) => ({
        adminBroOptions: {
          rootPath: '/admin',
          resources: [{ resource: userRepository }],
        },
        auth: {
          authenticate: async (email, password) => {
            const admin = await userRepository
              .createQueryBuilder('admin')
              .where('admin.email = :email', { email })
              .addSelect('admin.password')
              .getOne();
            if (!admin) return false;
            const isValid = await bcrypt.compare(password, admin.password);
            if (!isValid) return false;

            return admin as unknown as CurrentAdmin;
          },
          cookieName: 'test',
          cookiePassword: 'testPass',
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
    // AdminModule,
    ChannelModule,
    EventsModule,
    RelationModule,
    PassportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
