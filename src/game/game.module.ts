import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameObserver } from 'src/entities/GameObserver';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { GameService } from './game.service';
import { GameController } from './game.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameRoom, GameResult, GameObserver]),
  ],
  providers: [GameService],
  controllers: [GameController],
})
export class GameModule {}
