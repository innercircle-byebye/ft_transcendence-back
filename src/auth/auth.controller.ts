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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Google OAuth 로그인 화면요청' })
  @Get('google_login')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @ApiOperation({
    summary: 'Google OAuth에서 사용하는 callback URL(프론트서버에서 호출 x)',
  })
  @Redirect('http://localhost:3000')
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) res) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    let user = await this.userService.getByIntraUsername(req.user.intraId);
    // user.status = UserStatus.ONLINE;
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

  @ApiOperation({ summary: '42 OAuth 로그인 화면요청' })
  @Get('ft_login')
  @UseGuards(AuthGuard('ft'))
  ftLogin() {}

  @ApiOperation({
    summary: '42 OAuth에서 사용하는 callback URL(프론트서버에서 호출 x)',
  })
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

  @ApiOperation({ summary: 'refreshToken을 이용해서 accessToken 재발급' })
  @Get('refresh')
  @UseGuards(AuthGuard('refresh'))
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    const { user } = req;
    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    res.cookie('Authentication', accessToken, accessOption);
  }

  @ApiOperation({ summary: '로그아웃 (refreshToken 있어야만 로그아웃가능)' })
  @Get('logout')
  @UseGuards(AuthGuard('refresh'))
  async logOut(@Req() req, @Res({ passthrough: true }) res) {
    const { accessOption, refreshOption } =
      this.authService.getCookiesForLogOut();

    await this.userService.removeRefreshToken(req.user.userId, req.user.status);

    res.cookie('Authentication', '', accessOption);
    res.cookie('Refresh', '', refreshOption);
  }

  @ApiOperation({ summary: 'accessToken 테스트용' })
  @Get('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@Req() req) {
    console.log('req.user', req.user);
    return { userId: req.user.userId };
  }
}
