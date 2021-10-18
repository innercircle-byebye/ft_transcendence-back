import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({})
export class EventsModule {
  providers: [EventsGateway];
}
