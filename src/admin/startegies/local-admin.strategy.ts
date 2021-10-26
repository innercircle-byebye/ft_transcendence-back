import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminService } from 'src/admin/admin.service';

@Injectable()
export class LocalAdminStrategy extends PassportStrategy(Strategy) {
  constructor(private adminService: AdminService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string, done: CallableFunction) {
    const admin = await this.adminService.validateAdmin(email, password);
    if (!admin) {
      throw new UnauthorizedException();
    }
    return done(null, admin);
  }
}
