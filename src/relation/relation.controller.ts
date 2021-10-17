import { Controller, Get } from '@nestjs/common';
import { RelationService } from './relation.service';

@Controller('api')
export class RelationController {
  constructor(private relationService: RelationService) {}

  @Get('relation')
  getTest() {
    return this.relationService.test();
  }
}
