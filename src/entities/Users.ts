import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 32 })
  nickname: string;

  @Column({ unique: true })
  profileImage: string;
}
