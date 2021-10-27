import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthAdmin } from 'src/decorators/auth-admin.decorator';
import { Admin } from 'src/entities/Admin';
import { AdminService } from './admin.service';
import { AdminJoinDto } from './dto/admin-join.dto';
import { AdminUpdateDto } from './dto/admin-update.dto';
import { AdminDto } from './dto/admin.dto';
import { LocalAdminGuard } from './guards/local-admin.guard';
import { LoggedInAdminGuard } from './guards/logged-in-admin.guard';
import { NotLoggedInAdminGuard } from './guards/not-logged-in-admin.guard';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiOperation({
    summary: '전체 관리자 조회',
    description: '전체 관리자 목록을 조회합니다.',
  })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    type: AdminDto,
    isArray: true,
    description: '생성된 관리자의 정보',
  })
  @Get()
  getAllAdmin() {
    return this.adminService.getAllAdmin();
  }

  @ApiOperation({ summary: '내 정보 가져오기' })
  @ApiCookieAuth('connect.sid')
  @Get('me')
  async getAdminProfile(@AuthAdmin() admin: Admin) {
    return admin || false;
  }

  @ApiOperation({
    summary: '관리자 생성',
    description:
      '해당 요청을 통해 관리자를 생성합니다.\n\n' +
      '새로운 관리자 생성 시, 기존 관리자의 ID번호를 전달하여 새로 생성되는 관리자가 어떤 관리자로부터 생성 되었는지 저장합니다.',
  })
  @UseGuards(NotLoggedInAdminGuard)
  @ApiOkResponse({
    type: AdminDto,
    description: '생성된 관리자의 정보',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 관리자입니다.',
  })
  @ApiForbiddenResponse({ description: '이미 존재하는 이메일입니다.' })
  @Post()
  createAdmin(@Body() body: AdminJoinDto) {
    return this.adminService.createAdmin(
      body.email,
      body.nickname,
      body.password,
      body.fromId,
    );
  }

  @ApiOperation({
    summary: '관리자 정보 수정',
    description: '관리자의 로그인정보, 닉네임을 변경합니다.',
  })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @ApiOkResponse({
    type: AdminDto,
    description: '변경된 관리자의 정보 (비밀번호 제외)',
  })
  @ApiBadRequestResponse({
    description: '존재하지 않는 관리자입니다.',
  })
  @ApiForbiddenResponse({
    description: '이미 존재하는 이메일입니다.\n\n 이미 존재하는 닉네임입니다.',
  })
  @Patch()
  updateAdminInfo(@AuthAdmin() admin: Admin, @Body() body: AdminUpdateDto) {
    console.log(body);
    return this.adminService.updateAdmin(
      admin.adminId,
      body.email,
      body.nickname,
      body.password,
    );
  }

  @ApiOperation({ summary: '로그인' })
  @UseGuards(LocalAdminGuard)
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin4@aaa.com' },
        password: { type: 'string', example: 'aabbccdd' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'NestJS 프레임워크에서 생성되는 응답 object 전달',
  })
  @Post('login')
  async login(@AuthAdmin() admin: Admin) {
    return admin;
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiCookieAuth('connect.sid')
  @UseGuards(LoggedInAdminGuard)
  @Post('logout')
  async logout(@Res() res) {
    res.clearCookie('connect.sid', { httpOnly: true });
    return res.send('ok');
  }
}
