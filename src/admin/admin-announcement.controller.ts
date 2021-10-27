import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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
import { AnnouncementUpdateDto } from './dto/announcement-update.dto copy';
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

  @ApiOperation({
    summary: '내가 작성한 공지사항 보기',
    description: '현재 로그인한 관리자가 작성한 공지사항들을 확인합니다.',
  })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '공지사항 객체 목록',
    type: AnnouncementDto,
    isArray: true,
  })
  @Post('announcement/me')
  getAnnouncementByMe(@AuthAdmin() admin: Admin) {
    return this.adminService.getAnnouncementByMe(admin.adminId);
  }

  @ApiOperation({
    summary: '공지사항 조회 (id기준)',
    description: '공지사항 ID로 공지사항을 조회합니다.',
  })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '공지사항 객체 목록',
    type: AnnouncementDto,
  })
  @Post('announcement/:id')
  getAnnouncementById(@Param('id') id: number) {
    return this.adminService.getAnnouncementById(id);
  }

  @ApiOperation({ summary: '공지사항 작성' })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '작성한 공지사항 객체',
    type: AnnouncementDto,
  })
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

  @ApiOperation({ summary: '공지사항 삭제' })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '삭제된 공지사항 객체',
    type: AnnouncementDto,
  })
  @Delete('announcement/:id')
  async deleteAnnouncement(@AuthAdmin() admin: Admin, @Param('id') id: number) {
    return this.adminService.deleteAnnouncemnt(id, admin.adminId);
  }

  @ApiOperation({ summary: '공지사항 수정' })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '수정한 공지사항 객체',
    type: AnnouncementDto,
  })
  @Patch('announcement/:id')
  async modifyAnnouncement(
    @AuthAdmin() admin: Admin,
    @Param('id') id: number,
    @Body() body: AnnouncementUpdateDto,
  ) {
    return this.adminService.modifyAnnouncement(
      id,
      admin.adminId,
      body.title,
      body.content,
    );
  }

  // 관리자 생성, 수정 삭제
  // 공지사항 생성, 수정, 삭제
  // 신고내용 조회, 처리/수정, 삭제
}
