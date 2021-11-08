import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GameEventsGateway } from 'src/events/game-events.gateway';
import { RoomManagerService } from './room-manager.service';

@Injectable()
export class GameManagerService {
  constructor(
    private readonly gameEventsGateway: GameEventsGateway,
    private readonly roomManagerService: RoomManagerService,
  ) {}

  @Interval(10)
  update() {
    this.roomManagerService.getRoomsByGameRoomId().forEach((room) => {
      room.loop();
    });
  }
}
