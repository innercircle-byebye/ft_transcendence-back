import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { getConnectionOptions } from 'typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as ormconfig from './ormconfig';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ChannelModule } from './channel/channel.module';
import { EventsModule } from './events/events.module';
import { RelationModule } from './relation/relation.module';
import { DmModule } from './dm/dm.module';

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
    MulterModule.register({
      dest: './profile_image',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'profile_image'),
      serveRoot: '/profile_image',
    }),
    AdminModule,
    ChannelModule,
    EventsModule,
    RelationModule,
    DmModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
