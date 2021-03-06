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
    console.log('connect! ', socket.id);
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnect! ', socket.id);

    const userId = onlineGameMap[socket.id];

    const gameRoomId = this.roomManagerService.getGameRoomIdByUserId(userId);

    if (gameRoomId) {
      await this.gameEventsService.leaveGameRoom(userId, gameRoomId);

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
      await this.gameEventsService.getGameMemberInfoWithUser(
        gameRoomId,
        userId,
      );

    if (!gameMemberInfo) {
      socket.emit('leave');
      return;
    }

    const { user } = gameMemberInfo;

    if (gameMemberInfo.status === GameMemberStatus.PLAYER_ONE) {
      const gameResultInfo =
        await this.gameEventsService.getGameResultForCreateRoom(
          gameRoomId,
          user.userId,
        );
      this.roomManagerService.createRoom(
        this.server,
        gameRoomId,
        user,
        gameResultInfo.ballSpeed,
        gameResultInfo.winPoint,
      );
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

    let nickname: string;
    room.getParticipants().forEach((user) => {
      if (user.userId === userId) {
        nickname = user.nickname;
      }
    });

    const chatData = {
      index: room.nextGameChatIndex(),
      type: 'chat',
      nickname,
      content: data.content,
    };
    this.server.to(`game-${gameRoomId.toString()}`).emit('gameChat', chatData);
  }
}
