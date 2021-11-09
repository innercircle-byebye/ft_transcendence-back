export interface IUser {
  userId: number;

  email: string;

  intraUsername: string;

  nickname: string;

  imagePath: string;

  experience: number;

  // rankId: number;

  banDate: Date | null;

  isStatusPublic: boolean;

  isHistoryPublic: boolean;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;

  currentHashedRefreshToken: string;
}
