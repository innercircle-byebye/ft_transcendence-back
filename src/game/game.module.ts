import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { GameMember } from 'src/entities/GameMember';
import { DmModule } from 'src/dm/dm.module';
// import { DmService } from 'src/dm/dm.service';
import { EventsModule } from 'src/events/events.module';
import { GameService } from './game.service';
import { GameController } from './game.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameRoom, GameResult, GameMember]),
    DmModule,
    EventsModule,
  ],
  providers: [GameService],
  controllers: [GameController],
})
export class GameModule {}
