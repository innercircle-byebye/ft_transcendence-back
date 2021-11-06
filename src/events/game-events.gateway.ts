import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ namespace: '/game' })
// eslint-disable-next-line prettier/prettier
export class GameEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log(socket.id);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log(socket.id);
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() socket: Socket) {
    console.log('-- ready --');
    console.log(socket.id);
  }

  @SubscribeMessage('keyDown')
  handleKeyDown(@ConnectedSocket() socket: Socket) {
    console.log('-- keyDown --');
    console.log(socket.id);
  }

  @SubscribeMessage('keyUp')
  handleKeyUp(@ConnectedSocket() socket: Socket) {
    console.log('-- keyUp --');
    console.log(socket.id);
  }
}
