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
}
