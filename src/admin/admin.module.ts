import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from 'src/entities/Admin';
import { Announcement } from 'src/entities/Announcement';
import { Report } from 'src/entities/Report';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LocalAdminSerializer } from './local-admin.serializer';
import { LocalAdminStrategy } from './startegies/local-admin.strategy';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    TypeOrmModule.forFeature([Announcement, Admin, Report]),
  ],
  controllers: [AdminController],
  providers: [AdminService, LocalAdminStrategy, LocalAdminSerializer],
})
export class AdminModule {}
