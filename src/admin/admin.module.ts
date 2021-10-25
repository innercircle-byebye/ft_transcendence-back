import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Report } from 'src/entities/Report';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, Admin, Report])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
