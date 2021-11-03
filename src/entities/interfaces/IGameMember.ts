export interface IGameMember {
  gameRoomId: number;

  userId: number;

  status: any;

  banDate: Date | null;

  createdAt: Date;

  lastModifiedAt: Date;

  deletedAt: Date | null;
}
