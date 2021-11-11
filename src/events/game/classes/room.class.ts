import { Socket, Server } from 'socket.io';
import { Ball } from './ball.class';
import { Player } from './player.class';
import { SETTINGS, CLIENT_SETTINGS } from '../SETTINGS';
import { Countdown } from './countdown.class';

export enum RoomStatus {
  READY = 'ready',
  PLAYING = 'playing',
  COUNTDOWN = 'countdown',
}

export class Room {
  private id: number;

  private player1: Player;

  private player2: Player;

  private participants: Socket[] = [];

  private observers: string[] = []; // 소켓아이디 저장

  private players: Map<string, Player> = new Map<string, Player>();

  private ball: Ball;

  private roomStatus: RoomStatus;

  private server: Server;

  private countdown: Countdown;

  private gameChatIndex: number;

  loop: () => void;

  // private observers: Socket[];

  constructor(id: number, player1Socket: Socket, server: Server) {
    this.id = id;
    this.player1 = new Player(player1Socket.id, 'player1');
    this.participants.push(player1Socket);
    this.players.set(player1Socket.id, this.player1);
    this.ball = null;
    this.server = server;
    this.readyInit();
    this.gameChatIndex = 0;
  }

  nextGameChatIndex() {
    this.gameChatIndex += 1;
    return this.gameChatIndex;
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

  joinByObserver(observer: Socket) {
    this.participants.push(observer);
    this.observers.push(observer.id);
  }

  isEmpty() {
    return !this.player1;
  }

  leave(participant: Socket) {
    if (this.player1.getSocketId() === participant.id) {
      this.player1 = this.player2;
      if (this.player1) {
        this.player1.changeRole('player1');
      }
      delete this.player2;
      this.participants.shift();
      this.players.delete(participant.id);
    } else if (this.player2 && this.player2.getSocketId() === participant.id) {
      delete this.player2;
      this.participants.pop();
      this.players.delete(participant.id);
    } else if (this.observers.indexOf(participant.id) !== -1) {
      const index = this.observers.indexOf(participant.id);
      this.observers.splice(index, 1);
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
      this.player1.initPosition();
    }
    if (this.player2) {
      this.player2.initScore();
      this.player2.initPosition();
    }
    this.roomStatus = RoomStatus.READY;
    this.loop = this.readyLoop;

    this.emitGameRoomData();
  }

  readyLoop(): void {
    if (this.player1?.getReady() && this.player2?.getReady()) {
      this.playingInit();
    }
  }

  readyDestroy(): void {}

  playingInit(): void {
    this.player1.setReady(false);
    this.player2.setReady(false);
    this.server.to(`game-${this.id.toString()}`).emit('playing');
    this.ball.initPosition();
    this.roomStatus = RoomStatus.COUNTDOWN;
    this.loop = this.playingLoop;
    this.countdown = new Countdown();
  }

  playingLoop(): void {
    const statuses = [];

    this.player1.update();
    this.player2.update();
    if (this.roomStatus === RoomStatus.PLAYING) {
      this.ball.update();
    }

    statuses.push(this.player1.getStatus());
    statuses.push(this.player2.getStatus());
    statuses.push(this.ball.getStatus());

    if (this.roomStatus === RoomStatus.COUNTDOWN && this.countdown) {
      this.countdown.update();
      if (this.countdown.isEnd()) {
        this.roomStatus = RoomStatus.PLAYING;
        delete this.countdown;
      } else {
        statuses.push(this.countdown.getStatus());
      }
    }

    this.server.to(`game-${this.id.toString()}`).emit('update', statuses);

    if (
      this.player1.getScore() === SETTINGS.GOAL ||
      this.player2.getScore() === SETTINGS.GOAL
    ) {
      const winner =
        this.player1.getScore() > this.player2.getScore()
          ? 'player1'
          : 'player2';

      const chatData = {
        index: this.nextGameChatIndex(),
        type: 'log',
        content: `${winner}가 이겼습니다.`,
      };
      this.server.to(`game-${this.id.toString()}`).emit('gameChat', chatData);

      this.server
        .to(this.player1.getSocketId())
        .emit(
          'gameover',
          this.player1.getScore() > this.player2.getScore()
            ? 'YOU WIN!!!'
            : 'YOU LOSE!!!',
        );
      this.server
        .to(this.player2.getSocketId())
        .emit(
          'gameover',
          this.player2.getScore() > this.player1.getScore()
            ? 'YOU WIN!!!'
            : 'YOU LOSE!!!',
        );

      this.observers.forEach((socketId) => {
        this.server
          .to(socketId)
          .emit(
            'gameover',
            this.player1.getScore() > this.player2.getScore()
              ? 'PLAYER1 WIN!!!'
              : 'PLAYER2 WIN!!!',
          );
      });
      this.readyInit();
    }
  }

  emitGameRoomData() {
    const player1SocketId = this.player1 ? this.player1.getSocketId() : '';
    const player2SocketId = this.player2 ? this.player2.getSocketId() : '';
    const isPlaying = this.roomStatus !== RoomStatus.READY;
    const player1Ready = this.player1 ? this.player1.getReady() : false;
    const player2Ready = this.player2 ? this.player2.getReady() : false;

    const gameRoomData = {
      participants: {
        player1: {
          nickname: player1SocketId,
        },
        player2: {
          nickname: player2SocketId,
        },
        observers: this.observers.map((socketId) => {
          return {
            nickname: socketId,
          };
        }),
      },
      role: '',
      isPlaying,
      player1Ready,
      player2Ready,
      width: CLIENT_SETTINGS.WIDTH,
      height: CLIENT_SETTINGS.HEIGHT,
    };

    if (this.player1) {
      gameRoomData.role = 'player1';
      this.server.to(player1SocketId).emit('gameRoomData', gameRoomData);
    }

    if (this.player2) {
      gameRoomData.role = 'player2';
      this.server.to(player2SocketId).emit('gameRoomData', gameRoomData);
    }

    gameRoomData.role = 'observer';
    this.observers.forEach((socketId) => {
      this.server.to(socketId).emit('gameRoomData', gameRoomData);
    });
  }
}
