import { Module } from '@nestjs/common';
import { ChatEventsGateway } from './chat-events.gateway';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  providers: [MainEventsGateway, ChatEventsGateway],
  exports: [MainEventsGateway, ChatEventsGateway],
})
export class EventsModule {}
