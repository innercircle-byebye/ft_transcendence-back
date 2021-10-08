import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('ft_login')
  @UseGuards(AuthGuard('ft'))
  ftLogin() {}

  @Get('ft/callback')
  @UseGuards(AuthGuard('ft'))
  ftAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) {
      return 'No user from 42';
    }
    const accessToken = this.authService.generateAccessToken(req.user);
    res.cookie('pong_access_token', accessToken);
    return {
      message: 'User info from 42',
      user: req.user,
    };
  }

  // 테스트용
  @Get('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@Req() req) {
    console.log('req', req);
  }
}
