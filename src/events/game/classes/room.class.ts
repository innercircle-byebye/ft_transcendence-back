import { Server } from 'socket.io';
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

  private observers: string[] = []; // 소켓아이디 저장

  private players: Map<string, Player> = new Map<string, Player>();

  private ball: Ball;

  private roomStatus: RoomStatus;

  private server: Server;

  private countdown: Countdown;

  private gameChatIndex: number;

  loop: () => void;

  constructor(id: number, player1SocketId: string, server: Server) {
    this.id = id;
    this.player1 = new Player(player1SocketId, 'player1');
    this.players.set(player1SocketId, this.player1);
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

  setPlayer1(player1SocketId: string) {
    this.player1 = new Player(player1SocketId, 'player1');
    this.players.set(player1SocketId, this.player1);
  }

  setPlayer2(player2SocketId: string) {
    this.player2 = new Player(player2SocketId, 'player2');
    this.players.set(player2SocketId, this.player2);
    this.ball = new Ball(this.player1, this.player2);
  }

  unSetPlayer1() {
    const currentPlayer1SocketId = this.player1.getSocketId();
    delete this.player1;
    this.players.delete(currentPlayer1SocketId);
  }

  unSetPlayer2() {
    const currentPlayer2SocketId = this.player2.getSocketId();
    delete this.player2;
    this.players.delete(currentPlayer2SocketId);
  }

  joinByObserver(observerSocketId: string) {
    this.observers.push(observerSocketId);
  }

  isEmpty() {
    return !this.player1;
  }

  isObserver(socketId: string) {
    const index = this.observers.indexOf(socketId);
    return index !== -1;
  }

  getObserverCnt() {
    return this.observers.length;
  }

  toPlayer(socketId: string) {
    const index = this.observers.indexOf(socketId);
    this.observers.splice(index, 1);
    this.setPlayer2(socketId);
  }

  player2ToPlayer1() {
    this.player1 = this.player2;
    this.player1.changeRole('player1');
    delete this.player2;
  }

  observerToPlayer1() {
    const newPlayer1SocketId = this.observers.shift();
    this.setPlayer1(newPlayer1SocketId);
    this.players.set(newPlayer1SocketId, this.player1);
  }

  leave(participantSocketId: string) {
    if (this.player1.getSocketId() === participantSocketId) {
      // 플레이어가 나갈때 패처리로 gameover 이벤트 발생하는 부분
      if (this.roomStatus !== RoomStatus.READY) {
        const winner = 'player2';

        const chatData = {
          index: this.nextGameChatIndex(),
          type: 'log',
          content: `${winner}가 이겼습니다.`,
        };
        this.server.to(`game-${this.id.toString()}`).emit('gameChat', chatData);

        this.server
          .to(this.player1.getSocketId())
          .emit('gameover', 'YOU LOSE!!!');
        this.server
          .to(this.player2.getSocketId())
          .emit('gameover', 'YOU WIN!!!');

        this.observers.forEach((socketId) => {
          this.server.to(socketId).emit('gameover', 'PLAYER2 WIN!!!');
        });
        this.readyInit();
      }

      if (this.player2) {
        this.player1 = this.player2;
        this.player1.changeRole('player1');
        delete this.player2;
      } else if (this.observers.length !== 0) {
        const newPlayer1SocketId = this.observers.shift();
        this.setPlayer1(newPlayer1SocketId);
        this.players.set(newPlayer1SocketId, this.player1);
      } else {
        delete this.player1;
      }

      this.players.delete(participantSocketId);
    } else if (
      this.player2 &&
      this.player2.getSocketId() === participantSocketId
    ) {
      // 플레이어가 나갈때 패처리로 gameover 이벤트 발생하는 부분
      if (this.roomStatus !== RoomStatus.READY) {
        const winner = 'player1';

        const chatData = {
          index: this.nextGameChatIndex(),
          type: 'log',
          content: `${winner}가 이겼습니다.`,
        };
        this.server.to(`game-${this.id.toString()}`).emit('gameChat', chatData);

        this.server
          .to(this.player1.getSocketId())
          .emit('gameover', 'YOU WIN!!!');
        this.server
          .to(this.player2.getSocketId())
          .emit('gameover', 'YOU LOSE!!!');

        this.observers.forEach((socketId) => {
          this.server.to(socketId).emit('gameover', 'PLAYER1 WIN!!!');
        });
        this.readyInit();
      }

      delete this.player2;
      this.players.delete(participantSocketId);
    } else if (this.observers.indexOf(participantSocketId) !== -1) {
      const index = this.observers.indexOf(participantSocketId);
      this.observers.splice(index, 1);
    }
  }

  getParticipants(): string[] {
    const participants = [];
    if (this.player1) {
      participants.push(this.player1.getSocketId());
    }
    if (this.player2) {
      participants.push(this.player2.getSocketId());
    }
    this.observers.forEach((socketId) => {
      participants.push(socketId);
    });

    return participants;
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
    console.log('!!!!!! observers : ', this.observers);
    console.log('!!!!!! players   : ', this.players);
    console.log('!!!!!! player1.socketId : ', this.player1.getSocketId());
    console.log('!!!!!! player2.socketId : ', this.player2?.getSocketId());

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
