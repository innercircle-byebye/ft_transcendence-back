import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Redirect,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser } from 'src/decorators/auth-user.decorator';
import { User } from 'src/entities/User';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { TwoFactorAuthCodeDto } from './dto/two-factor-auth-code.dto';
import { FtGuard } from './guards/ft.guard';
import { GoogleGuard } from './guards/google.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtTwoFactorGuard } from './guards/jwt-two-factor.guard';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Google OAuth 로그인 화면요청' })
  @Get('google_login')
  @UseGuards(GoogleGuard)
  googleLogin() {}

  @ApiOperation({
    summary: 'Google OAuth에서 사용하는 callback URL(프론트서버에서 호출 x)',
  })
  @Redirect('http://localhost:3000')
  @Get('google/callback')
  @UseGuards(GoogleGuard)
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
  @UseGuards(FtGuard)
  ftLogin() {}

  @ApiOperation({
    summary: '42 OAuth에서 사용하는 callback URL(프론트서버에서 호출 x)',
  })
  @Redirect('http://localhost:3000')
  @Get('ft/callback')
  @UseGuards(FtGuard)
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
  @UseGuards(JwtRefreshGuard)
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
  @UseGuards(JwtRefreshGuard)
  async logOut(@Req() req, @Res({ passthrough: true }) res) {
    const { user } = req.user;
    const { accessOption, refreshOption } =
      this.authService.getCookiesForLogOut();

    await this.userService.removeRefreshToken(user.userId, user.status);

    res.cookie('Authentication', '', accessOption);
    res.cookie('Refresh', '', refreshOption);
  }

  @ApiOperation({ summary: 'accessToken with 2FA 테스트용' })
  @Get('/test')
  @UseGuards(JwtTwoFactorGuard)
  test(@AuthUser() user: User) {
    console.log('req.user', user);
    return { userId: user.userId };
  }

  @ApiOperation({
    summary: '2FA용 QRcode 생성   (2FA 인증 하기 전에 접근)',
    description:
      '2FA를 활성화 하기위한 QRcode를 생성해준다. 생성된 QRcode를 google authenticator에 등록할 수 있다.',
  })
  @ApiProduces('image/png')
  @ApiOkResponse({
    type: 'image/png', // TODO : swagger에 이미지로 표시되도록 수정해야함
    description: 'google authenticator 등록용 QRcode',
  })
  @ApiBadRequestResponse({
    description:
      '2FA가 비활성화되어 있을 때만, 2FA용 QRcode를 생성할 수 있습니다.',
  })
  @Get('2fa/generate')
  @UseGuards(JwtGuard)
  async generate2faQRcode(@AuthUser() user: User, @Res() res: Response) {
    if (user.isTwoFactorAuthEnabled) {
      throw new BadRequestException(
        '2FA가 비활성화되어 있을 때만, 2FA용 QRcode를 생성할 수 있습니다.',
      );
    }
    const { otpAuthUrl } = await this.authService.generateTwoFactorAuthSecret(
      user,
    );
    return this.authService.pipeQrCodeStream(res, otpAuthUrl);
  }

  @ApiOperation({
    summary: '2FA 활성화    (2FA 인증 하기 전에 접근)',
    description:
      'google authenticator에서 발급받은 otp를 사용해서 2FA를 활성화한다.',
  })
  @ApiResponse({
    status: 204,
    description: '2FA만 활성화되고 반환값 없음',
  })
  @ApiBadRequestResponse({
    description:
      '2FA가 이미 활성화 되어있습니다.\n\n' +
      '2FA에서 사용할 QRcode를 먼저 생성해야합니다.',
  })
  @ApiUnauthorizedResponse({
    description: '2FA 코드가 유효하지 않습니다.',
  })
  @Post('2fa/turn_on')
  @HttpCode(204)
  @UseGuards(JwtGuard)
  async turnOnTwoFactorAuth(
    @AuthUser() user: User,
    @Body() { twoFactorAuthCode }: TwoFactorAuthCodeDto,
  ) {
    if (user.isTwoFactorAuthEnabled) {
      throw new BadRequestException('2FA가 이미 활성화 되어있습니다.');
    }
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

  @ApiOperation({
    summary: '2FA 비활성화   (2FA 인증한 뒤 접근)',
    description:
      '2FA를 비활성화한다. (2FA 활성화하고 난 뒤에 사용이 가능하다.)',
  })
  @ApiResponse({
    status: 204,
    description: '2FA만 비활성화되고 반환값 없음',
  })
  @ApiBadRequestResponse({
    description: '2FA가 활성화되어있지 않습니다.',
  })
  @ApiUnauthorizedResponse({
    description: '2FA 인증이 필요합니다.',
  })
  @Post('2fa/turn_off')
  @HttpCode(204)
  @UseGuards(JwtTwoFactorGuard)
  async turnOffTwoFactorAuth(@AuthUser() user: User) {
    if (!user.isTwoFactorAuthEnabled) {
      throw new BadRequestException('2FA가 활성화되어있지 않습니다.');
    }
    await this.userService.onAndOffTwoFactorAuthentication(user.userId, false);
  }

  @ApiOperation({
    summary: '2FA 인증   (2FA 인증 하기 전에 접근)',
    description:
      '2FA가 활성화되어있는 상태에서, google authenticator의 otp를 사용해 인증을 한다.',
  })
  @ApiResponse({
    status: 204,
    description: '2FA 인증만되고 반환값 없음(새로운 토큰 쿠키에 담김)',
  })
  @ApiBadRequestResponse({
    description: '2FA가 활성화되어있지 않습니다.',
  })
  @ApiUnauthorizedResponse({
    description: '2FA 코드가 유효하지 않습니다.',
  })
  @Post('2fa/authenticate')
  @HttpCode(204)
  @UseGuards(JwtGuard)
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

  // TODO : 개발할때 테스트용임. 삭제해야함
  @ApiOperation({
    summary: 'nickname을 사용한 강제로그인 (테스트용)',
  })
  @ApiBadRequestResponse({
    description: '존재 하지 않는 사용자 입니다.',
  })
  @Redirect('http://localhost:3000')
  @Get('force_login/:nickname')
  async forceLoginForTest(
    @Req() req,
    @Res({ passthrough: true }) res,
    @Param('nickname') nickname: string,
  ) {
    const user = await this.userService.getByNickName(nickname);
    if (!user) {
      throw new BadRequestException('존재 하지 않는 사용자 입니다.');
    }

    const { accessToken, ...accessOption } =
      this.authService.getCookieWithJwtAccessToken(user.userId);
    const { refreshToken, ...refreshOption } =
      this.authService.getCookieWithJwtRefreshToken(user.userId);

    await this.userService.setCurrentRefreshToken(refreshToken, user);

    res.cookie('Authentication', accessToken, accessOption);
    res.cookie('Refresh', refreshToken, refreshOption);
  }
}
