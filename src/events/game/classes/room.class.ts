import { Socket } from 'socket.io';
import { Player } from './player.class';

export class Room {
  private id: number;

  private player1: Player;

  private player2: Player;

  private participants: Socket[];

  // private player1Score: Score;
  // private player2Score: Score;
  // private observers: Socket[];
  // private ball: Ball;
  // private countdown: Countdown;

  constructor(id: number, player1Socket: Socket) {
    this.id = id;
    this.player1 = new Player(player1Socket.id, 'player1');
    this.participants.push(player1Socket);
  }

  setPlayer2(player2Socket: Socket) {
    this.player2 = new Player(player2Socket.id, 'player2');
    this.participants.push(player2Socket);
  }

  getParticipants(): Socket[] {
    return this.participants;
  }
}
