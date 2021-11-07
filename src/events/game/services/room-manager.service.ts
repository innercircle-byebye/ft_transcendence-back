import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameEventsGateway } from 'src/events/game-events.gateway';
import { Room } from '../classes/room.class';

@Injectable()
export class RoomManagerService {
  roomByGameRoomId: Map<number, Room> = new Map<number, Room>();

  gameRoomIdBySocketId: Map<string, number> = new Map<string, number>();

  constructor(private readonly gameEventsGateway: GameEventsGateway) {}

  createRoom(gameRoomId: number, player1Socket: Socket): void {
    const room = new Room(gameRoomId, player1Socket);
    player1Socket.join(gameRoomId.toString());

    this.gameEventsGateway.server
      .to(`game-${gameRoomId.toString()}`)
      .emit('in');

    this.roomByGameRoomId.set(gameRoomId, room);
    this.gameRoomIdBySocketId.set(player1Socket.id, gameRoomId);
    console.log('Room Created : ', gameRoomId);
  }

  joinRoom(gameRoomId: number, player2Socket: Socket): void {
    const room = this.roomByGameRoomId.get(gameRoomId);
    room.setPlayer2(player2Socket);
    player2Socket.join(gameRoomId.toString());

    this.gameEventsGateway.server
      .to(`game-${gameRoomId.toString()}`)
      .emit('in');

    this.gameRoomIdBySocketId.set(player2Socket.id, gameRoomId);
  }

  destroy(gameRoomId) {
    const room = this.roomByGameRoomId.get(gameRoomId);
    const participants = room.getParticipants();
    participants.forEach((socket) => {
      this.gameRoomIdBySocketId.delete(socket.id);
      this.gameEventsGateway.server.to(socket.id).emit('destroy');
    });
    this.roomByGameRoomId.delete(gameRoomId);
  }
}
