import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from 'src/entities/Channel';
import { ChannelChat } from 'src/entities/ChannelChat';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { User } from 'src/entities/User';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Channel,
      ChannelChat,
      GameResult,
      GameMember,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
