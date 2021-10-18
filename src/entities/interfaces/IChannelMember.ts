export interface IChannelMember {
  mutedDate: Date | null;

  banDate: Date | null;

  isAdmin: boolean;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
