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
    this.roomManagerService
      .getRoomsByGameRoomId()
      .forEach((room, gameRoomId) => {
        const statuses = [];
        const { player1, player2 } = room.getPlayers();
        player1.update();
        statuses.push(player1.getStatus());
        if (player2) {
          player2.update();
          statuses.push(player2.getStatus());
        }

        this.gameEventsGateway.server
          .to(`game-${gameRoomId.toString()}`)
          .emit('update', statuses);
      });
  }
}
