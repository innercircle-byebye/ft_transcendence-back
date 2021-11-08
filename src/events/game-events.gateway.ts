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
import { RoomManagerService } from './game/services/room-manager.service';
import { CLIENT_SETTINGS } from './game/SETTINGS';

@WebSocketGateway({ namespace: '/game' })
// eslint-disable-next-line prettier/prettier
export class GameEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  constructor(private readonly roomManagerService: RoomManagerService) {}

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(socket.id);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(socket.id);
  }

  @SubscribeMessage('joinGameRoom')
  handleJoinGameRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() gameRoomId: number,
  ) {
    if (!this.roomManagerService.checkRoomExist(gameRoomId)) {
      this.roomManagerService.createRoom(this.server, gameRoomId, socket);
    } else {
      this.roomManagerService.joinRoom(this.server, gameRoomId, socket);
    }

    const room = this.roomManagerService.getRoomsByGameRoomId().get(gameRoomId);
    const role = room.getPlayerBySocketId(socket.id).getRole();

    this.server.to(socket.id).emit('initSetting', { role, ...CLIENT_SETTINGS });
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
}
