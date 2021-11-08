import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Room } from '../classes/room.class';

@Injectable()
export class RoomManagerService {
  roomsByGameRoomId: Map<number, Room> = new Map<number, Room>();

  gameRoomIdsBySocketId: Map<string, number> = new Map<string, number>();

  createRoom(server: Server, gameRoomId: number, player1Socket: Socket): void {
    const room = new Room(gameRoomId, player1Socket, server);
    player1Socket.join(`game-${gameRoomId.toString()}`);

    this.roomsByGameRoomId.set(gameRoomId, room);
    this.gameRoomIdsBySocketId.set(player1Socket.id, gameRoomId);
    console.log('Room Created : ', gameRoomId);
  }

  joinRoom(server: Server, gameRoomId: number, player2Socket: Socket): void {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    room.setPlayer2(player2Socket);
    player2Socket.join(`game-${gameRoomId.toString()}`);

    this.gameRoomIdsBySocketId.set(player2Socket.id, gameRoomId);
  }

  destroy(server: Server, gameRoomId) {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    const participants = room.getParticipants();
    participants.forEach((socket) => {
      this.gameRoomIdsBySocketId.delete(socket.id);
      server.to(socket.id).emit('destroy');
    });
    this.roomsByGameRoomId.delete(gameRoomId);
  }

  getRoomsByGameRoomId() {
    return this.roomsByGameRoomId;
  }

  getGameRoomIdBySocketId(socketId: string): number {
    return this.gameRoomIdsBySocketId.get(socketId);
  }

  checkRoomExist(gameRoomId): boolean {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    if (room) {
      return true;
    }
    return false;
  }
}
