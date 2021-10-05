import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // temporary

  // eslint-disable-next-line class-methods-use-this
  getHello(): string {
    return 'Hello World!';
  }
}
