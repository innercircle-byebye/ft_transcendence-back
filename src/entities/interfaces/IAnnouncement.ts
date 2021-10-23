export interface IAnnouncement {
  announcementId: number;

  adminId: number;

  title: string;

  content: string;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
