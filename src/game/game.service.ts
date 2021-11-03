import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DmService } from 'src/dm/dm.service';
import { GameMember } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Connection, Repository } from 'typeorm';

export enum GameRoomStatus {
  OBSERVABLE = 'observable',
  JOINABLE = 'joinable',
  FULL = 'full',
}
@Injectable()
export class GameService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GameRoom)
    private gameRoomRepository: Repository<GameRoom>,
    @InjectRepository(GameMember)
    private gameMemberRepository: Repository<GameMember>,
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
    private connection: Connection,
    private dmService: DmService, // events module needed private readonly chatEventsGateway: ChatEventsGateway,
  ) {}

  async getCurrentGameRoomMemberCount(id: number) {
    return this.gameMemberRepository
      .createQueryBuilder('gamemember')
      .where('gamemember.gameRoomId = :id', { id })
      .getCount();
  }

  async getCurrentGameRoomStatus(id: number) {
    const selectedGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId: id },
    });
    const latestGameResult = await this.gameResultRepository
      .createQueryBuilder('gameresult')
      .where('gameresult.gameRoomId = :id', { id })
      .orderBy('gameresult.lastModifiedAt', 'DESC')
      .getOne();
    const gameRoomMembers = await this.getCurrentGameRoomMemberCount(id);

    if (selectedGameRoom.maxParticipantNum === gameRoomMembers)
      return GameRoomStatus.FULL;
    if (latestGameResult.playerTwo === null) return GameRoomStatus.JOINABLE;
    return GameRoomStatus.OBSERVABLE;
  }

  async getAllGameRooms() {
    const allGameRoomsWithPassword = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .innerJoinAndSelect('gameroom.gameMembers', 'gamemember')
      .innerJoinAndSelect('gamemember.user', 'user')
      .orderBy('gameroom.createdAt', 'DESC')
      .select(['gameroom', 'user.userId', 'user.nickname', 'gamemember.status'])
      .addSelect('gameroom.password')
      .getMany();

    const allGameRoomsConverted = await Promise.all(
      allGameRoomsWithPassword.map(async (gameRoomList: any) => {
        gameRoomList.gameMembers.map((x) => {
          x.userId = x.user.userId;
          x.nickname = x.user.nickname;
          delete x.user;
          return x;
        });
        gameRoomList.currentMemberCount =
          await this.getCurrentGameRoomMemberCount(gameRoomList.gameRoomId);

        gameRoomList.gameRoomStatus = await this.getCurrentGameRoomStatus(
          gameRoomList.gameRoomId,
        );
        if (gameRoomList.password === null) gameRoomList.isPrivate = false;
        else gameRoomList.isPrivate = true;
        delete gameRoomList.password;
        return gameRoomList;
      }),
    );
    return allGameRoomsConverted;
  }
}
