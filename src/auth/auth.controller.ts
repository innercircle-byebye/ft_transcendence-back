import {
  Controller,
  Get,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Get('google_login')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Redirect('http://localhost:3000')
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    let user = await this.userService.getByIntraUsername(req.user.intraId);
    if (!user) {
      user = await this.userService.createNewUserByIntraInfo(req.user);
    }

    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.userId);

    await this.userService.setCurrentRefreshToken(refreshToken, user.userId);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
  }

  @Get('ft_login')
  @UseGuards(AuthGuard('ft'))
  ftLogin() {}

  @Redirect('http://localhost:3000')
  @Get('ft/callback')
  @UseGuards(AuthGuard('ft'))
  async ftAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    let user = await this.userService.getByIntraUsername(req.user.intraId);
    if (!user) {
      user = await this.userService.createNewUserByIntraInfo(req.user);
    }

    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.userId);

    await this.userService.setCurrentRefreshToken(refreshToken, user.userId);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
  }

  @Get('refresh')
  @UseGuards(AuthGuard('refresh'))
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    const { user } = req;
    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    res.cookie('Authentication', accessToken, accessOption);
  }

  @Get('logout')
  @UseGuards(AuthGuard('refresh'))
  async logOut(@Req() req, @Res({ passthrough: true }) res) {
    const { accessOption, refreshOption } =
      this.authService.getCookiesForLogOut();

    await this.userService.removeRefreshToken(req.user.id);

    res.cookie('Authentication', '', accessOption);
    res.cookie('Refresh', '', refreshOption);
  }

  // accessToken 테스트용
  @Get('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@Req() req) {
    console.log('req.user', req.user);
  }
}
