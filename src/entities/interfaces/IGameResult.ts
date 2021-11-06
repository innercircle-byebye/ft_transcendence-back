import { User } from '../User';

export interface IGameResult {
  gameResultId: number;

  gameRoomId: number;

  playerOne: User;

  playerTwo: User;

  playerOneScore: number | null;

  playerTwoScore: number | null;

  winPoint: number;

  ballSpeed: any;

  startAt: Date | null;

  endAt: Date | null;

  lastModifiedAt: Date;
}
