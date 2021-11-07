import { Module } from '@nestjs/common';
import { ChatEventsGateway } from './chat-events.gateway';
import { GameEventsGateway } from './game-events.gateway';
import { RoomManagerService } from './game/services/room-manager.service';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  providers: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
  ],
  exports: [
    MainEventsGateway,
    ChatEventsGateway,
    GameEventsGateway,
    RoomManagerService,
  ],
})
export class EventsModule {}
