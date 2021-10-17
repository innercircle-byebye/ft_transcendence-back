import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from 'src/entities/Block';
import { User } from 'src/entities/User';
import { RelationController } from './relation.controller';
import { RelationService } from './relation.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Block])],
  controllers: [RelationController],
  providers: [RelationService],
})
export class RelationModule {}
