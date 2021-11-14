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

    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    room.leave(socket.id);
    this.roomManagerService.gameRoomIdsBySocketId.delete(socket.id);

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

    delete onlineGameMap[socket.id];
  }

  @SubscribeMessage('joinGameRoom')
  async handleJoinGameRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    // TODO: roomId -> gameRoomId 바꾸자고 말해야함
    const { roomId: gameRoomId, userId } = data;

    onlineGameMap[socket.id] = userId;

    const gameMemberInfo =
      await this.gameEventsService.getGameMemberInfoWithUserAndGameRoom(
        gameRoomId,
        userId,
      );

    if (!gameMemberInfo) {
      return;
    }

    if (gameMemberInfo.status === GameMemberStatus.PLAYER_ONE) {
      this.roomManagerService.createRoom(this.server, gameRoomId, socket);
    } else if (gameMemberInfo.status === GameMemberStatus.PLAYER_TWO) {
      this.roomManagerService.joinRoomByPlayer2(
        this.server,
        gameRoomId,
        socket,
      );
    } else {
      this.roomManagerService.joinRoomByObserver(
        this.server,
        gameRoomId,
        socket,
      );
    }

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);

    room.emitGameRoomData();
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() socket: Socket) {
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    if (gameRoomId) {
      const room = this.roomManagerService
        .getRoomsByGameRoomId()
        .get(gameRoomId);
      room.getPlayerBySocketId(socket.id).setReady(true);

      const { player1, player2 } = room.getPlayers();
      if (player1?.getSocketId() === socket.id) {
        this.server
          .to(`game-${gameRoomId.toString()}`)
          .emit('ready', 'player1');
      } else if (player2?.getSocketId() === socket.id) {
        this.server
          .to(`game-${gameRoomId.toString()}`)
          .emit('ready', 'player2');
      }
    }
  }

  @SubscribeMessage('unReady')
  handleUnReady(@ConnectedSocket() socket: Socket) {
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    if (gameRoomId) {
      const room = this.roomManagerService
        .getRoomsByGameRoomId()
        .get(gameRoomId);
      room.getPlayerBySocketId(socket.id).setReady(false);

      const { player1, player2 } = room.getPlayers();
      if (player1?.getSocketId() === socket.id) {
        this.server
          .to(`game-${gameRoomId.toString()}`)
          .emit('unReady', 'player1');
      } else if (player2?.getSocketId() === socket.id) {
        this.server
          .to(`game-${gameRoomId.toString()}`)
          .emit('unReady', 'player2');
      }
    }
  }

  @SubscribeMessage('keyDown')
  handleKeyDown(
    @ConnectedSocket() socket: Socket,
    @MessageBody() keyCode: number,
  ) {
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    if (gameRoomId) {
      const room = this.roomManagerService
        .getRoomsByGameRoomId()
        .get(gameRoomId);
      room.getPlayerBySocketId(socket.id).setKeyPress(keyCode, true);
    }
  }

  @SubscribeMessage('keyUp')
  handleKeyUp(
    @ConnectedSocket() socket: Socket,
    @MessageBody() keyCode: number,
  ) {
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    if (gameRoomId) {
      const room = this.roomManagerService
        .getRoomsByGameRoomId()
        .get(gameRoomId);
      room.getPlayerBySocketId(socket.id).setKeyPress(keyCode, false);
    }
  }

  @SubscribeMessage('gameChat')
  handleGameChat(@ConnectedSocket() socket: Socket, @MessageBody() data: any) {
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    const { player1 } = room.getPlayers();

    const nickname =
      player1.getSocketId() === socket.id
        ? `(player1)${socket.id}`
        : `(player2)${socket.id}`;

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
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);

    const { player2 } = room.getPlayers();
    if (!player2 && room.isObserver(socket.id)) {
      room.toPlayer(socket.id);
    }
    room.emitGameRoomData();
  }

  @SubscribeMessage('toObserver')
  handleToObserver(@ConnectedSocket() socket: Socket) {
    console.log('~~~~~~~~ toObserver evnet ~~~~~~~~');
    const gameRoomId = this.roomManagerService.getGameRoomIdBySocketId(
      socket.id,
    );
    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);

    if (room.isPlaying()) {
      return;
    }

    const { player1, player2 } = room.getPlayers();

    if (player1.getSocketId() === socket.id) {
      console.log('~~~ player1 => observer');
      if (player2) {
        console.log('player2를 player1로 하고 player1은 관전자로된다.');
        room.unSetPlayer1();
        room.player2ToPlayer1();
        room.joinByObserver(socket.id);
      } else if (room.getObserverCnt() > 0) {
        console.log('관전자중 하나를  player1로 하고 player1은 관전자로된다.');
        room.unSetPlayer1();
        room.observerToPlayer1();
        room.joinByObserver(socket.id);
      } else {
        console.log('아무일도 안일어난다');
      }
    } else if (player2.getSocketId() === socket.id) {
      room.unSetPlayer2();
      room.joinByObserver(socket.id);
    }

    room.emitGameRoomData();
  }
}
