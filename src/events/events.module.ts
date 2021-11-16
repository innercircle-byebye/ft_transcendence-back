import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { ChatEventsGateway } from './chat-events.gateway';
import { GameEventsGateway } from './game-events.gateway';
import { GameEventsService } from './game-events.service';
import { GameManagerService } from './game/services/game-manager.service';
import { RoomManagerService } from './game/services/room-manager.service';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User, GameRoom, GameResult, GameMember])],
  providers: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
    GameManagerService,
    GameEventsService,
  ],
  exports: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
    // GameManagerService,
    // GameEventsService,
  ],
})
export class EventsModule {}
