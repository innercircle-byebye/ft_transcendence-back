import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { TwoFactorAuthCodeDto } from './dto/two-factor-auth-code.dto';

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
    if (!user) {
      user = await this.userService.createNewUserByIntraInfo(req.user);
    }

    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.userId);

    await this.userService.setCurrentRefreshToken(refreshToken, user);

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

    await this.userService.setCurrentRefreshToken(refreshToken, user);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
  }

  @ApiOperation({ summary: 'refreshToken을 이용해서 accessToken 재발급' })
  @Get('refresh')
  @UseGuards(AuthGuard('refresh'))
  refresh(@Req() req, @Res({ passthrough: true }) res) {
    const { user, isTwoFactorAuthenticated } = req.user;
    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(
        user.userId,
        isTwoFactorAuthenticated,
      );
    res.cookie('Authentication', accessToken, accessOption);
  }

  @ApiOperation({ summary: '로그아웃 (refreshToken 있어야만 로그아웃가능)' })
  @Get('logout')
  @UseGuards(AuthGuard('refresh'))
  async logOut(@AuthUser() user: User, @Res({ passthrough: true }) res) {
    const { accessOption, refreshOption } =
      this.authService.getCookiesForLogOut();

    await this.userService.removeRefreshToken(user.userId, user.status);

    res.cookie('Authentication', '', accessOption);
    res.cookie('Refresh', '', refreshOption);
  }

  @ApiOperation({ summary: 'accessToken 테스트용' })
  @Get('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@AuthUser() user: User) {
    console.log('req.user', user);
    return { userId: user.userId };
  }

  @Get('2fa/generate')
  @UseGuards(AuthGuard('jwt'))
  async generate2faQRcode(@AuthUser() user: User, @Res() res: Response) {
    const { otpAuthUrl } = await this.authService.generateTwoFactorAuthSecret(
      user,
    );
    return this.authService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @Post('2fa/turn_on')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async turnOnTwoFactorAuth(
    @AuthUser() user: User,
    @Body() { twoFactorAuthCode }: TwoFactorAuthCodeDto,
  ) {
    if (!user.twoFactorAuthSecret) {
      throw new BadRequestException(
        '2FA에서 사용할 QRcode를 먼저 생성해야합니다.',
      );
    }
    const isCodeValid = this.authService.isTwoFactorAuthCodeValid(
      user,
      twoFactorAuthCode,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('2FA 코드가 유효하지 않습니다.');
    }
    await this.userService.onAndOffTwoFactorAuthentication(user.userId, true);
  }

  // TODO : 2fa/turn_off 해야함

  @Post('2fa/authenticate')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  async authenticate(
    @AuthUser() user: User,
    @Res({ passthrough: true }) res,
    @Body() { twoFactorAuthCode }: TwoFactorAuthCodeDto,
  ) {
    if (!user.isTwoFactorAuthEnabled || !user.twoFactorAuthSecret) {
      throw new BadRequestException('2FA가 활성화되어있지 않습니다.');
    }
    const isCodeValid = this.authService.isTwoFactorAuthCodeValid(
      user,
      twoFactorAuthCode,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('2FA 코드가 유효하지 않습니다.');
    }

    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId, true);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.userId, true);

    await this.userService.setCurrentRefreshToken(refreshToken, user);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
  }
}
