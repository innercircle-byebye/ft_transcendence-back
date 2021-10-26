import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminService } from 'src/admin/admin.service';
import { Admin } from 'src/entities/Admin';
import { Repository } from 'typeorm';

@Injectable()
export class LocalAdminSerializer extends PassportSerializer {
  constructor(
    private readonly adminService: AdminService,
    @InjectRepository(Admin) private adminRepository: Repository<Admin>,
  ) {
    super();
  }

  serializeUser(admin: Admin, done: CallableFunction) {
    done(null, admin.adminId);
  }

  async deserializeUser(adminId: number, done: CallableFunction) {
    return this.adminRepository
      .findOneOrFail({ where: { adminId } })
      .then((admin) => {
        console.log('deserialize success', admin);
        done(null, admin);
      })
      .catch((error) => done(error));
  }
}
