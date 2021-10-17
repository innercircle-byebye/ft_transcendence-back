import { Module } from '@nestjs/common';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';

@Module({
  controllers: [RelationController],
  providers: [RelationService],
})
export class RelationModule {}
