export interface IChannel {
  channelId: number;

  name: string;

  password: string;

  maxParticipantNum: number;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
