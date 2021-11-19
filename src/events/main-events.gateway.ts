import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { onlineMap } from './onlineMap';
import { playerSets } from './playerSets';

@WebSocketGateway({ namespace: '/main' })
export class MainEventsGateway implements OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    delete onlineMap[socket.id];
    const onlineSet = new Set(Object.values(onlineMap));
    const uniqueOnlineList = [...onlineSet];
    socket.nsp.emit('onlineList', uniqueOnlineList);
  }

  @SubscribeMessage('login')
  handleLogin(
    @MessageBody() userId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    onlineMap[socket.id] = userId;
    const onlineSet = new Set(Object.values(onlineMap));
    const uniqueOnlineList = [...onlineSet];
    socket.nsp.emit('onlineList', uniqueOnlineList);

    const playerListData = {
      player1: Array.from(playerSets.player1),
      player2: Array.from(playerSets.player2),
    };
    this.server.to(socket.id).emit('playerList', playerListData);
  }

  @SubscribeMessage('onlineList')
  handleOnlineList(@ConnectedSocket() socket: Socket) {
    const onlineSet = new Set(Object.values(onlineMap));
    const uniqueOnlineList = [...onlineSet];
    this.server.to(socket.id).emit('onlineList', uniqueOnlineList);

    const playerListData = {
      player1: Array.from(playerSets.player1),
      player2: Array.from(playerSets.player2),
    };
    this.server.to(socket.id).emit('playerList', playerListData);
  }

  emitPlayerList() {
    const emitData = {
      player1: Array.from(playerSets.player1),
      player2: Array.from(playerSets.player2),
    };

    this.server.emit('playerList', emitData);
  }
}
