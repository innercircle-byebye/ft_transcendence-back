export interface IReport {
  reportId: number;

  reporterId: number;

  respondentId: number;

  reportContent: string;

  adminId: number;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
