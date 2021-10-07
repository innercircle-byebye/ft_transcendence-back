import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { RegisterRequestDto } from './dto/register.request.dto';
import { UserService } from './user.service';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUser(@Req() req) {
    return req.user;
  }

  @Post()
  postUser(@Body() body: RegisterRequestDto) {
    this.userService.postUser(body.nickaname, body.profileImage);
  }

  @Post('login')
  login() {}

  @Post('logout')
  logout(@Req() req, @Res() res) {
    req.logout();
    res.clearCooke('connect.sid', { httpOnly: true });
    res.send('ok');
  }
}
