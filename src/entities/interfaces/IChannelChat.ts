export interface IChannelChat {
  channelId: number;

  content: string;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;

  isDeleted: boolean;
}
