import { Module } from '@nestjs/common';
import { ChatEventsGateway } from './chat-events.gateway';
import { GameEventsGateway } from './game-events.gateway';
import { GameManagerService } from './game/services/game-manager.service';
import { RoomManagerService } from './game/services/room-manager.service';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  providers: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
    GameManagerService,
  ],
  exports: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
    GameManagerService,
  ],
})
export class EventsModule {}
