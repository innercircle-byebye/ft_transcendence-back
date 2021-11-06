export interface IGameRoom {
  gameRoomId: number;

  title: string;

  password: string;

  maxParticipantNum: number;

  createdAt: Date;

  lastModifiedAt: Date;

  deletedAt: Date;
}
