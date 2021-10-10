import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(userId: number) {
    const payload = { userId };
    return this.jwtService.sign(payload);
  }
}
