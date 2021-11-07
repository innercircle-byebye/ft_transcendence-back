import { Socket } from 'socket.io';
import { Player } from './player.class';

export class Room {
  private id: number;

  private player1: Player;

  private player2: Player;

  private participants: Socket[];

  private players: Map<string, Player>;

  // private player1Score: Score;
  // private player2Score: Score;
  // private observers: Socket[];
  // private ball: Ball;
  // private countdown: Countdown;

  constructor(id: number, player1Socket: Socket) {
    this.id = id;
    this.player1 = new Player(player1Socket.id, 'player1');
    this.participants.push(player1Socket);
    this.players.set(player1Socket.id, this.player1);
  }

  getPlayers() {
    return {
      player1: this.player1,
      player2: this.player2,
    };
  }

  getPlayerBySocketId(socketId: string) {
    return this.players.get(socketId);
  }

  setPlayer2(player2Socket: Socket) {
    this.player2 = new Player(player2Socket.id, 'player2');
    this.participants.push(player2Socket);
    this.players.set(player2Socket.id, this.player2);
  }

  getParticipants(): Socket[] {
    return this.participants;
  }
}
