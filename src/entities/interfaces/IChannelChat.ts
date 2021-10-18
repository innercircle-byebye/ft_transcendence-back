export interface IChannelChat {
  channelChatId: number;

  content: string;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
