export interface IGameObserver {
  gameRoomId: number;

  userId: number;

  banDate: Date | null;

  createdAt: Date;

  lastModifiedAt: Date;

  deletedAt: Date | null;
}
