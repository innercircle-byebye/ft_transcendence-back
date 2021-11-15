import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Repository } from 'typeorm';
import { Room } from './game/classes/room.class';

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

  async setGameResultStartTime(gameRoomId: number) {
    const gameResult = await this.gameResultRepository
      .createQueryBuilder('gameResult')
      .where({ gameRoomId })
      .andWhere({ startAt: null })
      .andWhere({ endAt: null })
      .getOne();
    gameResult.startAt = new Date();
    this.gameResultRepository.save(gameResult);
  }

  async setGameResult(room: Room) {
    const gameRoomId = room.gameRoomId();
    const { player1, player2 } = room.getPlayers();
    const playerOneId = player1.getUser().userId;
    const playerTwoId = player2.getUser().userId;
    const playerOneScore = player1.getScore();
    const plyaerTwoScore = player2.getScore();
    const winPoint = room.getWinPoint();
    const ballSpeed = room.getBallSpeed();

    // 현재 게임중인 gameResult 조회
    const gameResult = await this.gameResultRepository
      .createQueryBuilder('gameResult')
      .where({ gameRoomId })
      .andWhere({ playerOneId })
      .andWhere({ playerTwoId })
      .andWhere('gameResult.startAt IS NOT NULL')
      .andWhere({ endAt: null })
      .getOne();

    // TODO: 트렌젝션 묶어야할듯
    // 조회한 gameResult에 점수 반영하고 저장
    gameResult.endAt = new Date();
    gameResult.playerOneScore = playerOneScore;
    gameResult.playerTwoScore = plyaerTwoScore;
    await this.gameResultRepository.save(gameResult);

    // 새로운 gameResult 생성
    await this.gameResultRepository.save({
      gameRoomId,
      playerOneId,
      playerTwoId,
      winPoint,
      ballSpeed,
    });
  }
}
