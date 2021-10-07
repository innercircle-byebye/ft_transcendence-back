import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @Get('google-login')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    res.cookie('jwt-token', 'this_is_will_jwt');
    if (!req.user) {
      return 'No user from google';
    }
    return {
      message: 'User info from Google',
      user: req.user,
    };
  }
}
