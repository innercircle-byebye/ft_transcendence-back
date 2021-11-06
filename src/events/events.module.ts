import { Module } from '@nestjs/common';
import { ChatEventsGateway } from './chat-events.gateway';
import { GameEventsGateway } from './game-events.gateway';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  providers: [MainEventsGateway, ChatEventsGateway, GameEventsGateway],
  exports: [MainEventsGateway, ChatEventsGateway, GameEventsGateway],
})
export class EventsModule {}
