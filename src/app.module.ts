import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { getConnectionOptions } from 'typeorm';
import * as ormconfig from './ormconfig';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
    }),
    AuthModule,
    UserModule,
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await ormconfig, { autoLoadEntities: true }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
