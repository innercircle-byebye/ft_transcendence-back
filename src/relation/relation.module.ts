import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { Friend } from 'src/entities/Friend';
import { User } from 'src/entities/User';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block, Friend])],
  controllers: [RelationController],
  providers: [RelationService],
})
export class RelationModule {}
