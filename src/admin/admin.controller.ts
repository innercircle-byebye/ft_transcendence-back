import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminJoinDto } from './dto/admin-join.dto';
import { AdminDto } from './dto/admin.dto';
import { AnnoumcementDto } from './dto/announcement.dto';

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
    summary: '관리자 생성',
    description: '해당 요청을 통해 관리자를 생성합니다.',
  })
  @ApiOkResponse({
    type: AdminDto,
    description: '생성된 관리자의 정보',
  })
  @Post('/')
  createAdmin(@Body() body: AdminJoinDto) {
    return this.adminService.createAdmin(
      body.email,
      body.password,
      body.fromId,
    );
  }

  // 관리자 생성, 수정 삭제
  // 공지사항 생성, 수정, 삭제
  // 신고내용 조회, 처리/수정, 삭제
}
