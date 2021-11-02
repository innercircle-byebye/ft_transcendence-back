export enum BallSpeed {
  FAST = 'fast',
  MEDIUM = 'medium',
  SLOW = 'slow',
}

export interface IGameRoom {
  gameRoomId: number;

  title: string;

  password: string;

  maxParticipantNum: number;

  createdAt: Date;

  lastModifiedAt: Date;

  deletedAt: Date;
}
