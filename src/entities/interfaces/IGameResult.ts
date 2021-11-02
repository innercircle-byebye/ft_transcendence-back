import { User } from '../User';
import { BallSpeed } from './IGameRoom';

export interface IGameResult {
  gameResultId: number;

  gameRoomId: number;

  playerOne: User;

  playerTwo: User;

  playerOneScore: number | null;

  playerTwoScore: number | null;

  winPoint: number;

  ballSpeed: BallSpeed;

  startAt: Date | null;

  endAt: Date | null;

  lastModifiedAt: Date;
}
