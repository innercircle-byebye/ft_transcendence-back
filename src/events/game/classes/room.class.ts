import { Server } from 'socket.io';
import { IUser } from 'src/entities/interfaces/IUser';
import { Ball } from './ball.class';
import { Player } from './player.class';
import { SETTINGS, CLIENT_SETTINGS } from '../SETTINGS';
import { Countdown } from './countdown.class';
import { onlineGameMap } from '../../onlineGameMap';

export enum RoomStatus {
  READY = 'ready',
  PLAYING = 'playing',
  COUNTDOWN = 'countdown',
}

export class Room {
  private id: number;

  private player1: Player;

  private player2: Player;

  private observers: IUser[] = [];

  private players: Map<number, Player> = new Map<number, Player>(); // key: userId , value: Player

  private ball: Ball;

  private roomStatus: RoomStatus;

  private server: Server;

  private countdown: Countdown;

  private gameChatIndex: number;

  loop: () => void;

  constructor(id: number, player1User: IUser, server: Server) {
    this.id = id;
    this.player1 = new Player(player1User, 'player1');
    this.players.set(player1User.userId, this.player1);
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

  getPlayerByUserId(userId: number) {
    return this.players.get(userId);
  }

  setPlayer1(player1User: IUser) {
    this.player1 = new Player(player1User, 'player1');
    this.players.set(player1User.userId, this.player1);
  }

  setPlayer2(player2User: IUser) {
    this.player2 = new Player(player2User, 'player2');
    this.players.set(player2User.userId, this.player2);
    this.ball = new Ball(this.player1, this.player2);
  }

  unSetPlayer1() {
    const currentPlayer1User = this.player1.getUser();
    delete this.player1;
    this.players.delete(currentPlayer1User.userId);
  }

  unSetPlayer2() {
    const currentPlayer2User = this.player2.getUser();
    delete this.player2;
    this.players.delete(currentPlayer2User.userId);
  }

  joinByObserver(observerUser: IUser) {
    this.observers.push(observerUser);
  }

  isEmpty() {
    return !this.player1;
  }

  isObserver(userId: number) {
    for (let i = 0; i < this.observers.length; i += 1) {
      if (this.observers[i].userId === userId) {
        return true;
      }
    }
    return false;
  }

  getObserverCnt() {
    return this.observers.length;
  }

  isPlaying() {
    return this.roomStatus !== RoomStatus.READY;
  }

  toPlayer(userId: number) {
    let index;
    for (let i = 0; i < this.observers.length; i += 1) {
      if (this.observers[i].userId === userId) {
        index = i;
        break;
      }
    }

    const targetObserver = this.observers.splice(index, 1)[0];
    this.setPlayer2(targetObserver);
  }

  player2ToPlayer1() {
    this.player1 = this.player2;
    this.player1.changeRole('player1');
    delete this.player2;
  }

  observerToPlayer1() {
    const newPlayer1User = this.observers.shift();
    this.setPlayer1(newPlayer1User);
    this.players.set(newPlayer1User.userId, this.player1);
  }

  leave(participantUserId: number) {
    if (this.player1.getUser().userId === participantUserId) {
      // 플레이어가 나갈때 패처리로 gameover 이벤트 발생하는 부분
      if (this.roomStatus !== RoomStatus.READY) {
        const winner = 'player2';

        const chatData = {
          index: this.nextGameChatIndex(),
          type: 'log',
          content: `${winner}가 이겼습니다.`,
        };
        this.server.to(`game-${this.id.toString()}`).emit('gameChat', chatData);

        const player1SocketId = Object.keys(onlineGameMap).find(
          (key) => onlineGameMap[key] === this.player1.getUser().userId,
        );
        const player2SocketId = Object.keys(onlineGameMap).find(
          (key) => onlineGameMap[key] === this.player2.getUser().userId,
        );
        this.server.to(player1SocketId).emit('gameover', 'YOU LOSE!!!');
        this.server.to(player2SocketId).emit('gameover', 'YOU WIN!!!');

        this.observers.forEach((user) => {
          const socketId = Object.keys(onlineGameMap).find(
            (key) => onlineGameMap[key] === user.userId,
          );
          this.server.to(socketId).emit('gameover', 'PLAYER2 WIN!!!');
        });
        this.readyInit();
      }

      if (this.player2) {
        this.player1 = this.player2;
        this.player1.changeRole('player1');
        delete this.player2;
      } else if (this.observers.length !== 0) {
        const newPlayer1User = this.observers.shift();
        this.setPlayer1(newPlayer1User);
        this.players.set(newPlayer1User.userId, this.player1);
      } else {
        delete this.player1;
      }

      this.players.delete(participantUserId);
    } else if (
      this.player2 &&
      this.player2.getUser().userId === participantUserId
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

        const player1SocketId = Object.keys(onlineGameMap).find(
          (key) => onlineGameMap[key] === this.player1.getUser().userId,
        );
        const player2SocketId = Object.keys(onlineGameMap).find(
          (key) => onlineGameMap[key] === this.player2.getUser().userId,
        );
        this.server.to(player1SocketId).emit('gameover', 'YOU WIN!!!');
        this.server.to(player2SocketId).emit('gameover', 'YOU LOSE!!!');

        this.observers.forEach((user) => {
          const socketId = Object.keys(onlineGameMap).find(
            (key) => onlineGameMap[key] === user.userId,
          );
          this.server.to(socketId).emit('gameover', 'PLAYER1 WIN!!!');
        });
        this.readyInit();
      }

      delete this.player2;
      this.players.delete(participantUserId);
    } else if (this.isObserver(participantUserId)) {
      let index;
      for (let i = 0; i < this.observers.length; i += 1) {
        if (this.observers[i].userId === participantUserId) {
          index = i;
        }
      }
      this.observers.splice(index, 1);
    }
  }

  getParticipants(): IUser[] {
    const participants = [];
    if (this.player1) {
      participants.push(this.player1.getUser());
    }
    if (this.player2) {
      participants.push(this.player2.getUser());
    }
    this.observers.forEach((user) => {
      participants.push(user);
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

  // readyDestroy(): void {}

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

      const player1SocketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === this.player1.getUser().userId,
      );
      const player2SocketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === this.player2.getUser().userId,
      );
      this.server
        .to(player1SocketId)
        .emit(
          'gameover',
          this.player1.getScore() > this.player2.getScore()
            ? 'YOU WIN!!!'
            : 'YOU LOSE!!!',
        );
      this.server
        .to(player2SocketId)
        .emit(
          'gameover',
          this.player2.getScore() > this.player1.getScore()
            ? 'YOU WIN!!!'
            : 'YOU LOSE!!!',
        );

      this.observers.forEach((user) => {
        const socketId = Object.keys(onlineGameMap).find(
          (key) => onlineGameMap[key] === user.userId,
        );
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
    console.log('!!!!!! players   : ');
    this.players.forEach((value, key) => {
      console.log(key, ' : ', value.getUser().userId);
    });
    console.log('!!!!!! player1.userId : ', this.player1.getUser().userId);
    console.log('!!!!!! player2.userId : ', this.player2?.getUser().userId);

    const player1User = this.player1?.getUser();
    const player2User = this.player2?.getUser();
    const isPlaying = this.roomStatus !== RoomStatus.READY;
    const player1Ready = this.player1 ? this.player1.getReady() : false;
    const player2Ready = this.player2 ? this.player2.getReady() : false;

    const gameRoomData = {
      participants: {
        player1: player1User,
        palyer2: player2User,
        observers: this.observers,
      },
      role: '',
      isPlaying,
      player1Ready,
      player2Ready,
      width: CLIENT_SETTINGS.WIDTH,
      height: CLIENT_SETTINGS.HEIGHT,
    };

    if (this.player1) {
      const player1SocketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === player1User.userId,
      );
      gameRoomData.role = 'player1';
      this.server.to(player1SocketId).emit('gameRoomData', gameRoomData);
    }
    if (this.player2) {
      const player2SocketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === player2User.userId,
      );
      gameRoomData.role = 'player2';
      this.server.to(player2SocketId).emit('gameRoomData', gameRoomData);
    }

    gameRoomData.role = 'observer';
    this.observers.forEach((user) => {
      const socketId = Object.keys(onlineGameMap).find(
        (key) => onlineGameMap[key] === user.userId,
      );
      this.server.to(socketId).emit('gameRoomData', gameRoomData);
    });
  }
}
