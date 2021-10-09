import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { RegisterRequestDto } from './dto/register.request.dto';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '유저 정보 조회' })
  @Get()
  getUser(@Req() req) {
    return req.user;
  }

  @ApiOperation({ summary: '회원 가입' })
  @Post()
  async postUser(@Body() data: RegisterRequestDto) {
    await this.userService.registerUser(
      data.intraUsername,
      data.email,
      data.nickname,
      data.imagePath,
    );
  }

  @ApiOperation({ summary: '로그인' })
  @Post('login')
  login() {}

  @ApiOperation({ summary: '로그아웃' })
  @Post('logout')
  logout(@Req() req, @Res() res) {
    req.logout();
    res.clearCooke('connect.sid', { httpOnly: true });
    res.send('ok');
  }
}
