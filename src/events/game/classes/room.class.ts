import { Socket, Server } from 'socket.io';
import { Ball } from './ball.class';
import { Player } from './player.class';

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

  getParticipants(): Socket[] {
    return this.participants;
  }

  getBall(): Ball | null {
    return this.ball;
  }

  readyInit(): void {
    this.roomStatus = RoomStatus.READY;
    this.loop = this.readyLoop;
  }

  readyLoop(): void {
    if (this.player1?.getReady() && this.player2?.getReady()) {
      this.playingInit();
    }
    const statuses = [];
    this.player1.update();
    statuses.push(this.player1.getStatus());
    if (this.player2) {
      this.player2.update();
      statuses.push(this.player2.getStatus());
    }

    if (this.ball) {
      // this.ball.update();
      statuses.push(this.ball.getStatus());
    }

    this.server.to(`game-${this.id.toString()}`).emit('update', statuses);
  }

  readyDestroy(): void {}

  playingInit(): void {
    this.roomStatus = RoomStatus.PLAYING;
    this.loop = this.playingLoop;
  }

  playingLoop(): void {
    const statuses = [];
    this.player1.update();
    statuses.push(this.player1.getStatus());
    if (this.player2) {
      this.player2.update();
      statuses.push(this.player2.getStatus());
    }

    if (this.ball) {
      this.ball.update();
      statuses.push(this.ball.getStatus());
    }

    this.server.to(`game-${this.id.toString()}`).emit('update', statuses);
  }
}
