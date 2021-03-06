import { Server } from 'socket.io';
import { IUser } from 'src/entities/interfaces/IUser';
import { BallSpeed } from 'src/entities/GameResult';
import { GameEventsService } from 'src/events/game-events.service';
import { MainEventsGateway } from 'src/events/main-events.gateway';
import { playerSets } from 'src/events/playerSets';
import { Ball } from './ball.class';
import { Player } from './player.class';
import { CLIENT_SETTINGS } from '../SETTINGS';
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

  private ballSpeed: BallSpeed;

  private ball: Ball;

  private winPoint: number;

  private roomStatus: RoomStatus;

  private server: Server;

  private countdown: Countdown;

  private gameChatIndex: number;

  private gameEventsService: GameEventsService;

  private mainEventsGateway: MainEventsGateway;

  loop: () => void;

  constructor(
    id: number,
    player1User: IUser,
    server: Server,
    ballSpeed: BallSpeed,
    winPoint: number,
    gameEventsService: GameEventsService,
    mainEventsGateway: MainEventsGateway,
  ) {
    this.id = id;
    this.player1 = new Player(player1User, 'player1');
    this.players.set(player1User.userId, this.player1);
    this.ballSpeed = ballSpeed;
    this.ball = null;
    this.winPoint = winPoint;
    this.server = server;
    this.readyInit();
    this.gameChatIndex = 0;
    this.gameEventsService = gameEventsService;
    this.mainEventsGateway = mainEventsGateway;

    playerSets.player1.add(player1User.userId);
    this.mainEventsGateway.emitPlayerList();
  }

  nextGameChatIndex() {
    this.gameChatIndex += 1;
    return this.gameChatIndex;
  }

  gameRoomId(): number {
    return this.id;
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

  getWinPoint(): number {
    return this.winPoint;
  }

  setWinPoint(winPoint: number) {
    this.winPoint = winPoint;
  }

  getBallSpeed(): BallSpeed {
    return this.ballSpeed;
  }

  setBallSpeed(ballSpeed: BallSpeed) {
    this.ballSpeed = ballSpeed;
  }

  setPlayer1(player1User: IUser) {
    this.player1 = new Player(player1User, 'player1');
    this.players.set(player1User.userId, this.player1);
  }

  setPlayer2(player2User: IUser) {
    this.player2 = new Player(player2User, 'player2');
    this.players.set(player2User.userId, this.player2);
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

  removeFromObservers(observerId: number) {
    for (let i = 0; i < this.observers.length; i += 1) {
      if (this.observers[i].userId === observerId) {
        this.observers.splice(i, 1);
        return;
      }
    }
  }

  getSocketServer() {
    return this.server;
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

  switchPlayers(): void {
    const temp = this.player1;
    this.player1 = this.player2;
    this.player2 = temp;

    this.player1.changeRole('player1');
    this.player2.changeRole('player2');

    playerSets.player1.delete(this.player2.getUser().userId);
    playerSets.player2.delete(this.player1.getUser().userId);
    playerSets.player1.add(this.player1.getUser().userId);
    playerSets.player2.add(this.player2.getUser().userId);
    this.mainEventsGateway.emitPlayerList();
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

  leave(leaveUserId: number) {
    if (this.player1.getUser().userId === leaveUserId) {
      // ??????????????? ????????? ???????????? gameover ????????? ???????????? ??????
      if (this.roomStatus !== RoomStatus.READY) {
        const winnerNickname = this.player2.getUser().nickname;
        const loserNickname = this.player1.getUser().nickname;

        const chatData = {
          index: this.nextGameChatIndex(),
          type: 'log',
          nickname: '[system]',
          content: `[${winnerNickname}]?????? [${loserNickname}]?????? ???????????????.`,
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
          this.server
            .to(socketId)
            .emit('gameover', `[${winnerNickname}] WIN!!!`);
        });
        this.readyInit();
      }

      if (this.player2) {
        this.player1 = this.player2;
        this.player1.changeRole('player1');
        delete this.player2;

        playerSets.player1.delete(leaveUserId);
        playerSets.player2.delete(this.player1.getUser().userId);
        playerSets.player1.add(this.player1.getUser().userId);
        this.mainEventsGateway.emitPlayerList();
      } else if (this.observers.length !== 0) {
        const newPlayer1User = this.observers.shift();
        this.setPlayer1(newPlayer1User);
        this.players.set(newPlayer1User.userId, this.player1);

        playerSets.player1.delete(leaveUserId);
        playerSets.player1.add(this.player1.getUser().userId);
        this.mainEventsGateway.emitPlayerList();
      } else {
        delete this.player1;
        playerSets.player1.delete(leaveUserId);
        this.mainEventsGateway.emitPlayerList();
      }

      this.players.delete(leaveUserId);
    } else if (this.player2 && this.player2.getUser().userId === leaveUserId) {
      // ??????????????? ????????? ???????????? gameover ????????? ???????????? ??????
      if (this.roomStatus !== RoomStatus.READY) {
        const winnerNickname = this.player1.getUser().nickname;
        const loserNickname = this.player2.getUser().nickname;

        const chatData = {
          index: this.nextGameChatIndex(),
          type: 'log',
          nickname: '[system]',
          content: `[${winnerNickname}]?????? [${loserNickname}]?????? ???????????????.`,
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
          this.server
            .to(socketId)
            .emit('gameover', `[${winnerNickname}] WIN!!!`);
        });
        this.readyInit();
      }

      delete this.player2;
      this.players.delete(leaveUserId);

      playerSets.player2.delete(leaveUserId);
      this.mainEventsGateway.emitPlayerList();
    } else if (this.isObserver(leaveUserId)) {
      let index;
      for (let i = 0; i < this.observers.length; i += 1) {
        if (this.observers[i].userId === leaveUserId) {
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

  playingInit(): void {
    this.player1.setReady(false);
    this.player2.setReady(false);
    this.server.to(`game-${this.id.toString()}`).emit('playing');
    this.ball = new Ball(this.player1, this.player2, this.ballSpeed);
    this.roomStatus = RoomStatus.COUNTDOWN;
    this.loop = this.playingLoop;
    this.countdown = new Countdown();
    this.gameEventsService.setGameResultStartTime(this.id);
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
      this.player1.getScore() === this.winPoint ||
      this.player2.getScore() === this.winPoint
    ) {
      let winnerNickname;
      let loserNickname;
      if (this.player1.getScore() > this.player2.getScore()) {
        winnerNickname = this.player1.getUser().nickname;
        loserNickname = this.player2.getUser().nickname;
      } else {
        winnerNickname = this.player2.getUser().nickname;
        loserNickname = this.player1.getUser().nickname;
      }

      const chatData = {
        index: this.nextGameChatIndex(),
        type: 'log',
        nickname: '[system]',
        content: `[${winnerNickname}]?????? [${loserNickname}]?????? ???????????????.`,
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
        this.server.to(socketId).emit('gameover', `[${winnerNickname}] WIN!!!`);
      });

      this.gameEventsService.applyGameResult(this);
      // player2??? ????????? player1?????????.
      if (this.player2.getScore() > this.player1.getScore()) {
        this.switchPlayers();
      }
      this.readyInit();
    }
  }

  emitGameRoomData() {
    const player1User = this.player1?.getUser();
    const player2User = this.player2?.getUser();
    const isPlaying = this.roomStatus !== RoomStatus.READY;
    const player1Ready = this.player1 ? this.player1.getReady() : false;
    const player2Ready = this.player2 ? this.player2.getReady() : false;

    const gameRoomData = {
      participants: {
        player1: player1User,
        player2: player2User,
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
