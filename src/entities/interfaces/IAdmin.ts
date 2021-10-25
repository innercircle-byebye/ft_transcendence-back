export interface IAdmin {
  adminId: number;

  email: string;

  password: string;

  readonly createdAt: Date;

  readonly lastModifiedAt: Date;

  deletedAt: Date;
}
