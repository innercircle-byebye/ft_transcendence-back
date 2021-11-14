import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameMemberStatus } from 'src/entities/GameMember';
import { GameEventsService } from './game-events.service';
import { RoomManagerService } from './game/services/room-manager.service';
import { onlineGameMap } from './onlineGameMap';

@WebSocketGateway({ namespace: '/game' })
// eslint-disable-next-line prettier/prettier
export class GameEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  constructor(
    private readonly gameEventsService: GameEventsService,
    private readonly roomManagerService: RoomManagerService,
  ) {}

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('connect!!!!!!!!!!  ', socket.id);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnect!!!!!!!   ', socket.id);

    const userId = onlineGameMap[socket.id];

    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (gameRoomId) {
      const room = this.roomManagerService
        .getRoomsByGameRoomId()
        .get(gameRoomId);
      room.leave(userId);
      this.roomManagerService.gameRoomIdsByUserId.delete(userId);

      if (room.isEmpty()) {
        this.roomManagerService.destroy(this.server, gameRoomId);
      } else {
        const { player2 } = room.getPlayers();
        if (player2) {
          room.emitGameRoomData();
        } else {
          room.readyInit();
        }
      }
    }

    delete onlineGameMap[socket.id];
  }

  @SubscribeMessage('joinGameRoom')
  async handleJoinGameRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    const { gameRoomId, userId } = data;

    onlineGameMap[socket.id] = userId;

    const gameMemberInfo =
      await this.gameEventsService.getGameMemberInfoWithUserAndGameRoom(
        gameRoomId,
        userId,
      );

    if (!gameMemberInfo) {
      return;
    }

    // const { user, gameRoom } = gameMemberInfo;
    const { user } = gameMemberInfo;

    if (gameMemberInfo.status === GameMemberStatus.PLAYER_ONE) {
      this.roomManagerService.createRoom(this.server, gameRoomId, user);
      socket.join(`game-${gameRoomId.toString()}`);
    } else if (gameMemberInfo.status === GameMemberStatus.PLAYER_TWO) {
      this.roomManagerService.joinRoomByPlayer2(gameRoomId, user);
      socket.join(`game-${gameRoomId.toString()}`);
    } else {
      this.roomManagerService.joinRoomByObserver(gameRoomId, user);
      socket.join(`game-${gameRoomId.toString()}`);
    }

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    room.emitGameRoomData();
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() socket: Socket) {
    const userId = onlineGameMap[socket.id];
    if (!userId) return;

    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (!gameRoomId) return;

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    const player = room.getPlayerByUserId(userId);
    if (!player) return;

    player.setReady(true);
    const { player1, player2 } = room.getPlayers();
    if (player1?.getUser().userId === userId) {
      this.server.to(`game-${gameRoomId.toString()}`).emit('ready', 'player1');
    } else if (player2?.getUser().userId === userId) {
      this.server.to(`game-${gameRoomId.toString()}`).emit('ready', 'player2');
    }
  }

  @SubscribeMessage('unReady')
  handleUnReady(@ConnectedSocket() socket: Socket) {
    const userId = onlineGameMap[socket.id];
    if (!userId) return;

    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (!gameRoomId) return;

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    const player = room.getPlayerByUserId(userId);
    if (!player) return;

    player.setReady(false);
    const { player1, player2 } = room.getPlayers();
    if (player1?.getUser().userId === userId) {
      this.server
        .to(`game-${gameRoomId.toString()}`)
        .emit('unReady', 'player1');
    } else if (player2?.getUser().userId === userId) {
      this.server
        .to(`game-${gameRoomId.toString()}`)
        .emit('unReady', 'player2');
    }
  }

  @SubscribeMessage('keyDown')
  handleKeyDown(
    @ConnectedSocket() socket: Socket,
    @MessageBody() keyCode: number,
  ) {
    const userId = onlineGameMap[socket.id];
    if (!userId) return;
    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (!gameRoomId) return;

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    room.getPlayerByUserId(userId)?.setKeyPress(keyCode, true);
  }

  @SubscribeMessage('keyUp')
  handleKeyUp(
    @ConnectedSocket() socket: Socket,
    @MessageBody() keyCode: number,
  ) {
    const userId = onlineGameMap[socket.id];
    if (!userId) return;
    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (!gameRoomId) return;

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    room.getPlayerByUserId(userId)?.setKeyPress(keyCode, false);
  }

  @SubscribeMessage('gameChat')
  handleGameChat(@ConnectedSocket() socket: Socket, @MessageBody() data: any) {
    const userId = onlineGameMap[socket.id];
    if (!userId) return;
    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    if (!gameRoomId) return;

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    const { player1, player2 } = room.getPlayers();

    let nickname = `${userId}`;
    if (player1?.getUser().userId === userId) {
      nickname = `(player1)${userId}`;
    } else if (player2?.getUser().userId === userId) {
      nickname = `(player2)${userId}`;
    }

    const chatData = {
      index: room.nextGameChatIndex(),
      type: 'chat',
      nickname,
      content: data.content,
    };
    this.server.to(`game-${gameRoomId.toString()}`).emit('gameChat', chatData);
  }

  @SubscribeMessage('toPlayer')
  handleToPlayer(@ConnectedSocket() socket: Socket) {
    console.log('~~~~~~~~ toPlayer evnet ~~~~~~~~');
    const userId = onlineGameMap[socket.id];
    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);

    const { player2 } = room.getPlayers();
    if (!player2 && room.isObserver(userId)) {
      room.toPlayer(userId);
    }
    room.emitGameRoomData();
  }

  @SubscribeMessage('toObserver')
  handleToObserver(@ConnectedSocket() socket: Socket) {
    console.log('~~~~~~~~ toObserver evnet ~~~~~~~~');
    const userId = onlineGameMap[socket.id];
    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);
    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);

    if (room.isPlaying()) {
      return;
    }

    const { player1, player2 } = room.getPlayers();

    if (player1.getUser().userId === userId) {
      console.log('~~~ player1 => observer');
      if (player2) {
        console.log('player2를 player1로 하고 player1은 관전자로된다.');
        room.unSetPlayer1();
        room.player2ToPlayer1();
        room.joinByObserver(userId);
      } else if (room.getObserverCnt() > 0) {
        console.log('관전자중 하나를  player1로 하고 player1은 관전자로된다.');
        room.unSetPlayer1();
        room.observerToPlayer1();
        room.joinByObserver(userId);
      } else {
        console.log('아무일도 안일어난다');
      }
    } else if (player2.getUser().userId === userId) {
      room.unSetPlayer2();
      room.joinByObserver(userId);
    }

    room.emitGameRoomData();
  }
}
