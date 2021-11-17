import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { BallSpeed } from 'src/entities/GameResult';
import { IUser } from 'src/entities/interfaces/IUser';
import { GameEventsService } from 'src/events/game-events.service';
import { onlineGameMap } from 'src/events/onlineGameMap';
import { Room } from '../classes/room.class';

@Injectable()
export class RoomManagerService {
  roomsByGameRoomId: Map<number, Room> = new Map<number, Room>(); // key: gameRoomId, value: Room

  gameRoomIdsByUserId: Map<number, number> = new Map<number, number>(); // key: userId, value: gameRoomId

  constructor(private readonly gameEventsService: GameEventsService) {}

  createRoom(
    server: Server,
    gameRoomId: number,
    player1User: IUser,
    ballSpeed: BallSpeed,
    winPoint: number,
  ): void {
    const room = new Room(
      gameRoomId,
      player1User,
      server,
      ballSpeed,
      winPoint,
      this.gameEventsService,
    );
    // player1Socket.join(`game-${gameRoomId.toString()}`);
    this.roomsByGameRoomId.set(gameRoomId, room);
    this.gameRoomIdsByUserId.set(player1User.userId, gameRoomId);
    console.log('Room Created : ', gameRoomId);
  }

  joinRoomByPlayer2(gameRoomId: number, player2User: IUser): void {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    room.setPlayer2(player2User);
    // newParticipant.join(`game-${gameRoomId.toString()}`);
    this.gameRoomIdsByUserId.set(player2User.userId, gameRoomId);
  }

  joinRoomByObserver(gameRoomId: number, observerUser: IUser): void {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    room.joinByObserver(observerUser);
    // newParticipant.join(`game-${gameRoomId.toString()}`);
    this.gameRoomIdsByUserId.set(observerUser.userId, gameRoomId);
  }

  destroy(server: Server, gameRoomId) {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    const participants = room.getParticipants();
    participants.forEach((user) => {
      this.gameRoomIdsByUserId.delete(user.userId);

      const socketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === user.userId,
      );
      server.to(socketId).emit('destroy');
    });
    this.roomsByGameRoomId.delete(gameRoomId);
  }

  getRoomsByGameRoomId() {
    return this.roomsByGameRoomId;
  }

  getGameRoomIdByUserId(userId: number): number {
    return this.gameRoomIdsByUserId.get(userId);
  }

  checkRoomExist(gameRoomId): boolean {
    const room = this.roomsByGameRoomId.get(gameRoomId);
    if (room) {
      return true;
    }
    return false;
  }

  kick(userId: number) {
    const roomId = this.getGameRoomIdByUserId(userId);
    const room = this.getRoomsByGameRoomId().get(roomId);

    if (room.isPlaying()) {
      return;
    }

    const { player2 } = room.getPlayers();
    if (player2?.getUser().userId === userId) {
      room.unSetPlayer2();
    } else if (room.isObserver(userId)) {
      room.removeFromObservers(userId);
    }

    const socketId = Object.keys(onlineGameMap).find(
      (key) => onlineGameMap[key] === userId,
    );
    room.getSocketServer().to(socketId).emit('kick');

    room.emitGameRoomData();
  }

  moveToPlayer(userId: number) {
    const roomId = this.getGameRoomIdByUserId(userId);
    const room = this.getRoomsByGameRoomId().get(roomId);
    const { player2 } = room.getPlayers();
    if (!player2 && room.isObserver(userId)) {
      room.toPlayer(userId);
    }
    room.emitGameRoomData();
  }

  moveToObserver(userId: number) {
    const gameRoomId = this.getGameRoomIdByUserId(userId);
    const room = this.getRoomsByGameRoomId().get(gameRoomId);

    if (room.isPlaying()) {
      return;
    }

    const { player1, player2 } = room.getPlayers();

    if (player1.getUser().userId === userId) {
      const player1User = player1.getUser();
      if (player2) {
        room.unSetPlayer1();
        room.player2ToPlayer1();
        room.joinByObserver(player1User);
      } else if (room.getObserverCnt() > 0) {
        room.unSetPlayer1();
        room.observerToPlayer1();
        room.joinByObserver(player1User);
      }
    } else if (player2.getUser().userId === userId) {
      const player2User = player2.getUser();
      room.unSetPlayer2();
      room.joinByObserver(player2User);
    }
    room.emitGameRoomData();
  }
}
