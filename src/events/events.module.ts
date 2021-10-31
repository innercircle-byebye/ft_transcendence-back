import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { MainEventsGateway } from './main-events.gateway';

@Module({
  providers: [EventsGateway, MainEventsGateway],
  exports: [EventsGateway, MainEventsGateway],
})
export class EventsModule {}
