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

@WebSocketGateway({ namespace: '/main' })
export class MainEventsGateway implements OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    delete onlineMap[socket.id];
  }

  @SubscribeMessage('login')
  handleLogin(
    @MessageBody() userId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    onlineMap[socket.id] = userId;
    socket.nsp.emit('onlineList', Object.values(onlineMap));
  }
}
