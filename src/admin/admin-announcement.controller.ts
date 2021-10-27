import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthAdmin } from 'src/decorators/auth-admin.decorator';
import { Admin } from 'src/entities/Admin';
import { AdminService } from './admin.service';
import { AnnouncementCreateDto } from './dto/announcement-create.dto';
import { AnnouncementDto } from './dto/announcement.dto';
import { LoggedInAdminGuard } from './guards/logged-in-admin.guard';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminAnnouncementController {
  constructor(private adminService: AdminService) {}

  @ApiOperation({ summary: '전체 공지사항 조회' })
  @ApiOkResponse({
    description: '공지사항 객체 목록',
    type: AnnouncementDto,
    isArray: true,
  })
  @Get('announcement')
  getAnnouncement() {
    return this.adminService.getAllAnnouncement();
  }

  @ApiOperation({ summary: '공지사항 작성' })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @Post('announcement')
  createAnnouncement(
    @AuthAdmin() admin: Admin,
    @Body() body: AnnouncementCreateDto,
  ) {
    return this.adminService.createAnnouncement(
      admin.adminId,
      body.title,
      body.content,
    );
  }
  // 관리자 생성, 수정 삭제
  // 공지사항 생성, 수정, 삭제
  // 신고내용 조회, 처리/수정, 삭제
}
