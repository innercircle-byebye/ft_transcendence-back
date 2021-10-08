import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  generateAccessToken(user: any) {
    // user는 OAuth를 생성된 값이다.
    // user정보에 해당하는 User가 DB에 저장되어있으면 그 값을 가져오고,
    // 유저상태가 not_register로 바로 생성하고 값을 가져온다.
    const payload = { intraId: user.intraId };
    return this.jwtService.sign(payload);
  }
}
