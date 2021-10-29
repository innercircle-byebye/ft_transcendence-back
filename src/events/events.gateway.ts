/* eslint-disable @typescript-eslint/no-unused-vars */ // 해당 파일만 rule 추가
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { onlineMap } from './onlineMap';

@WebSocketGateway({ namespace: '/chat' })
// eslint-disable-next-line prettier/prettier
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server: Server;

  private logger: Logger = new Logger('AppGateway');

  afterInit(server: Server): any {
    this.logger.log('chat namespace initialized');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    if (!onlineMap[socket.nsp.name]) {
      onlineMap[socket.nsp.name] = {};
    }
    console.log(`${socket.id} connected to 채팅`);
    socket.emit('hello', socket.id);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    delete onlineMap[socket.nsp.name][socket.id];
    console.log(`${socket.id} disconnected to ${socket.nsp.name}`);
  }

  @SubscribeMessage('chatLogin')
  handleLogin(
    @MessageBody() userId: number,
    @ConnectedSocket() socket: Socket,
  ) {
    onlineMap[socket.nsp.name][socket.id] = userId;
  }

  @SubscribeMessage('joinChannel')
  handleJoinChannel(client: any, channelName: number) {
    console.log(channelName);
    client.join(`channel-${channelName}`);
    client.emit('joinChannel', channelName);
  }

  // @SubscribeMessage('message')
  // handleMessage(client: any, channelMessage: any) {
  //   console.log(channelMessage);
  // }

  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(client: any, channelName: number) {
    client.leave(`channel-${channelName}`);
    client.emit('leaveChannel', channelName);
  }
}
