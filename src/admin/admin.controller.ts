import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthAdmin } from 'src/decorators/auth-admin.decorator';
import { Admin } from 'typeorm';
import { AdminService } from './admin.service';
import { AdminJoinDto } from './dto/admin-join.dto';
import { AdminDto } from './dto/admin.dto';
import { AnnoumcementDto } from './dto/announcement.dto';
import { LocalAdminGuard } from './guards/local-admin.guard';
import { LoggedInAdminGuard } from './guards/logged-in-admin.guard';
import { NotLoggedInAdminGuard } from './guards/not-logged-in-admin.guard';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiOkResponse({
    description: '공지사항 목력 출력',
    type: AnnoumcementDto,
    isArray: true,
  })
  @ApiOperation({ summary: '공지사항 확인' })
  @Get('/announcement')
  getAnnouncement() {
    return this.adminService.getAnnouncement();
  }

  @ApiOperation({
    summary: '전체 관리자 조회',
    description: '전체 관리자 목록을 조회합니다.',
  })
  @ApiOkResponse({
    type: AdminDto,
    isArray: true,
    description: '생성된 관리자의 정보',
  })
  // @UseGuards(LoggedInAdminGuard)
  @Get()
  getAllAdmin() {
    return this.adminService.getAllAdmin();
  }

  @ApiOperation({
    summary: '관리자 생성',
    description: '해당 요청을 통해 관리자를 생성합니다.',
  })
  @ApiOkResponse({
    type: AdminDto,
    description: '생성된 관리자의 정보',
  })
  @UseGuards(NotLoggedInAdminGuard)
  @Post()
  createAdmin(@Body() body: AdminJoinDto) {
    console.log(body.email);
    return this.adminService.createAdmin(
      body.email,
      body.nickname,
      body.password,
      body.fromId,
    );
  }

  @ApiOperation({ summary: '로그인' })
  @UseGuards(LocalAdminGuard)
  @Post('login')
  async login(@AuthAdmin() admin: Admin) {
    return admin;
  }

  // 관리자 생성, 수정 삭제
  // 공지사항 생성, 수정, 삭제
  // 신고내용 조회, 처리/수정, 삭제
}
