import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';

@Injectable()
export class GameEventsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GameRoom)
    private gameRoomRepository: Repository<GameRoom>,
    @InjectRepository(GameMember)
    private gameMemberRepository: Repository<GameMember>,
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
  ) {}

  async getGameMemberInfoWithUser(
    gameRoomId: number,
    userId: number,
  ): Promise<GameMember> {
    return this.gameMemberRepository
      .createQueryBuilder('gameMember')
      .where({ userId })
      .andWhere({ gameRoomId })
      .innerJoinAndSelect('gameMember.user', 'user')
      .getOne();
  }

  async getGameResultForCreateRoom(
    gameRoomId: number,
    userId: number,
  ): Promise<GameResult> {
    return this.gameResultRepository
      .createQueryBuilder('gameResult')
      .where({ gameRoomId })
      .andWhere({ playerOneId: userId })
      .andWhere({ playerTwoId: null })
      .andWhere({ startAt: null })
      .andWhere({ endAt: null })
      .getOne();
  }
}
