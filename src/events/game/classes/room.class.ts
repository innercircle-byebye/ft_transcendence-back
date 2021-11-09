import { Socket, Server } from 'socket.io';
import { Ball } from './ball.class';
import { Player } from './player.class';
import { SETTINGS } from '../SETTINGS';

export enum RoomStatus {
  READY = 'ready',
  PLAYING = 'playing',
}

export class Room {
  private id: number;

  private player1: Player;

  private player2: Player;

  private participants: Socket[] = [];

  private players: Map<string, Player> = new Map<string, Player>();

  private ball: Ball;

  private roomStatus: RoomStatus;

  private server: Server;

  loop: () => void;

  // private observers: Socket[];
  // private countdown: Countdown;

  constructor(id: number, player1Socket: Socket, server: Server) {
    this.id = id;
    this.player1 = new Player(player1Socket.id, 'player1');
    this.participants.push(player1Socket);
    this.players.set(player1Socket.id, this.player1);
    this.ball = null;
    this.server = server;
    this.readyInit();
  }

  getPlayers() {
    return {
      player1: this.player1,
      player2: this.player2,
    };
  }

  getPlayerBySocketId(socketId: string) {
    return this.players.get(socketId);
  }

  setPlayer2(player2Socket: Socket) {
    this.player2 = new Player(player2Socket.id, 'player2');
    this.participants.push(player2Socket);
    this.players.set(player2Socket.id, this.player2);
    this.ball = new Ball(this.player1, this.player2);
  }

  isEmpty() {
    return !this.player1;
  }

  leave(player: Socket) {
    if (this.player1.getSocketId() === player.id) {
      this.player1 = this.player2;
      if (this.player1) {
        this.player1.changeRole('player1');
      }
      delete this.player2;
      this.participants.shift();
      this.players.delete(player.id);
    } else if (this.player2 && this.player2.getSocketId() === player.id) {
      delete this.player2;
      this.participants.pop();
      this.players.delete(player.id);
    }
  }

  getParticipants(): Socket[] {
    return this.participants;
  }

  getBall(): Ball | null {
    return this.ball;
  }

  readyInit(): void {
    if (this.player1) {
      this.player1.initScore();
    }
    if (this.player2) {
      this.player2.initScore();
    }
    this.roomStatus = RoomStatus.READY;
    this.loop = this.readyLoop;
  }

  readyLoop(): void {
    if (this.player1?.getReady() && this.player2?.getReady()) {
      this.playingInit();
    }
    const statuses = [];
    if (this.player1) {
      this.player1.update();
      statuses.push(this.player1.getStatus());
    }
    if (this.player2) {
      this.player2.update();
      statuses.push(this.player2.getStatus());
    }

    this.server.to(`game-${this.id.toString()}`).emit('update', statuses);
  }

  readyDestroy(): void {}

  playingInit(): void {
    this.player1.setReady(false);
    this.player2.setReady(false);
    this.server.to(`game-${this.id.toString()}`).emit('playing');
    this.ball.initPosition();
    this.roomStatus = RoomStatus.PLAYING;
    this.loop = this.playingLoop;
  }

  playingLoop(): void {
    const statuses = [];
    if (this.player1) {
      this.player1.update();
      statuses.push(this.player1.getStatus());
    }
    if (this.player2) {
      this.player2.update();
      statuses.push(this.player2.getStatus());
    }

    if (this.ball) {
      this.ball.update();
      statuses.push(this.ball.getStatus());
    }

    if (this.player1.getScore() === SETTINGS.GOAL) {
      this.readyInit();
      this.server.to(`game-${this.id.toString()}`).emit('gameover');
    } else if (this.player2.getScore() === SETTINGS.GOAL) {
      this.readyInit();
      this.server.to(`game-${this.id.toString()}`).emit('gameover');
    } else {
      this.server.to(`game-${this.id.toString()}`).emit('update', statuses);
    }
  }
}