import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ReportDto } from './dto/report.dto';
import { LoggedInAdminGuard } from './guards/logged-in-admin.guard';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminReportController {
  constructor(private adminService: AdminService) {}

  @ApiOperation({
    summary: '전체 신고 목록 조회',
    description: '전체 신고 목록을 조회합니다. (관리자만 접근 가능합니다)',
  })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    description: '전체 신고 목록',
    type: ReportDto,
    isArray: true,
  })
  @Get('report')
  getAllReports() {
    return this.adminService.getAllReports();
  }
}
