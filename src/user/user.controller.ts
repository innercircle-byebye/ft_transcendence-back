import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { UserDto } from 'src/common/dto/user.dto';
import { RegisterRequestDto } from './dto/register.request.dto';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOperation({ summary: '전체 유저 확인' })
  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  // TODO: connect.sid 를 통해 현재 자기자신 조회할 수 있도록 업데이트 필요
  @ApiOkResponse({ type: UserDto })
  @ApiOperation({ summary: '유저 확인' })
  @Get('/:id')
  async getUser(@Param('id') userId) {
    return this.userService.getUser(userId);
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
    return 'ok';
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

  @ApiOperation({ summary: '유저 삭제' })
  @Delete('/:id')
  async deleteUser(@Param('id') userId) {
    return this.userService.deleteUser(userId);
  }
}
