import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  email: string;

  @Column({ name: 'intra_username', length: 50, unique: true })
  intraUsername: string;

  @Column({ length: 32 })
  nickname: string;

  @Column({ unique: true })
  profileImage: string;

  @Column({ nullable: true })
  @Exclude()
  currentHashedRefreshToken: string;
}
