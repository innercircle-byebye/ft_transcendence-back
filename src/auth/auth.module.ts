import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { FtStrategy } from './strategies/ft.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtTwoFactorStrategy } from './strategies/jwt-two-factor.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FtStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFactorStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    FtStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFactorStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
