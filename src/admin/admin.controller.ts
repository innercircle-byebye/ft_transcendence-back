import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AnnoumcementDto } from './dto/announcement.dto';

@ApiTags('admin')
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

  // 관리자 생성, 수정 삭제
  // 공지사항 생성, 수정, 삭제
  // 신고내용 조회, 처리/수정, 삭제
}
