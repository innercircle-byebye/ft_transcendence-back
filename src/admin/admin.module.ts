import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from 'src/entities/Announcement';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
