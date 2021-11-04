import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DmService } from 'src/dm/dm.service';
import { GameMember, GameMemberStatus } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Connection, Repository } from 'typeorm';
import { GameRoomCreateDto } from './dto/gameroom-create.dto';
import { GameRoomDto, GameRoomStatus } from './dto/gameroom.dto';

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
    const checkPlayableFromGameMember = await this.gameMemberRepository
      .createQueryBuilder('gamemember')
      .where('gamemember.gameRoomId = :id', { id })
      .andWhere('gamemember.status = :playerTwo', { playerTwo: 'player2' })
      .getOne();
    const gameRoomMembersCount = await this.getCurrentGameRoomMemberCount(id);

    if (selectedGameRoom.maxParticipantNum === gameRoomMembersCount)
      return GameRoomStatus.FULL;
    if (checkPlayableFromGameMember === undefined)
      return GameRoomStatus.PLAYABLE;
    return GameRoomStatus.OBSERVABLE;
  }

  async getGameRoomTotalInfo(gameRoomId: number): Promise<GameRoomDto> {
    const gameRoomForReturn: any = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .where('gameroom.gameRoomId = :gameRoomId', {
        gameRoomId,
      })
      .innerJoinAndSelect('gameroom.gameResults', 'gameresult')
      .innerJoinAndSelect('gameroom.gameMembers', 'gamemember')
      .innerJoinAndSelect('gamemember.user', 'user')
      .select([
        'gameroom',
        'user.userId',
        'user.nickname',
        'gamemember.status',
        'gameresult',
      ])
      .addSelect('gameroom.password')
      .getOne();

    gameRoomForReturn.gameMembers.map((x) => {
      x.userId = x.user.userId;
      x.nickname = x.user.nickname;
      delete x.user;
      return x;
    });
    gameRoomForReturn.gameResults.map((x) => {
      delete x.gameResultId;
      delete x.gameRoomId;
      return x;
    });

    gameRoomForReturn.currentMemberCount =
      await this.getCurrentGameRoomMemberCount(gameRoomForReturn.gameRoomId);

    gameRoomForReturn.gameRoomStatus = await this.getCurrentGameRoomStatus(
      gameRoomForReturn.gameRoomId,
    );
    if (gameRoomForReturn.password === null)
      gameRoomForReturn.isPrivate = false;
    else gameRoomForReturn.isPrivate = true;
    delete gameRoomForReturn.password;
    return gameRoomForReturn;
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

  async getAllChannelsWithPaging(page: number) {
    // 한 화면에 8번
    const GAMEROOM_PER_PER_PAGE = 8;
    const allGameRoomsWithPassword = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .innerJoinAndSelect('gameroom.gameMembers', 'gamemember')
      .innerJoinAndSelect('gamemember.user', 'user')
      .select(['gameroom', 'user.userId', 'user.nickname', 'gamemember.status'])
      .addSelect('gameroom.password')
      .orderBy('gameroom.createdAt', 'DESC')
      .take(GAMEROOM_PER_PER_PAGE)
      .skip(GAMEROOM_PER_PER_PAGE * (page - 1))
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

  async createGameRoom(
    playerOneId: number,
    gameRoomCreateDto: GameRoomCreateDto,
  ) {
    console.log(playerOneId, gameRoomCreateDto);

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (
      gameRoomCreateDto.maxParticipantNum < 2 ||
      gameRoomCreateDto.maxParticipantNum > 8
    )
      throw new BadRequestException(
        '게임 참여 인원은 최소 2명 이상, 최대 8명 이하입니다.',
      );
    const checkExistGameRoom = await this.gameRoomRepository.findOne({
      where: [{ title: gameRoomCreateDto.title, deletedAt: null }],
    });
    if (checkExistGameRoom)
      throw new BadRequestException('이미 존재하는 게임방 이름입니다.');

    let gameRoomReturned;
    try {
      const newGameRoom = new GameRoom();
      newGameRoom.title = gameRoomCreateDto.title;
      if (gameRoomCreateDto.password)
        newGameRoom.password = gameRoomCreateDto.password;
      newGameRoom.maxParticipantNum = gameRoomCreateDto.maxParticipantNum;
      gameRoomReturned = await queryRunner.manager
        .getRepository(GameRoom)
        .save(newGameRoom);

      const gameRoomPlayerOne = new GameMember();
      gameRoomPlayerOne.gameRoomId = gameRoomReturned.gameRoomId;
      gameRoomPlayerOne.userId = playerOneId;
      gameRoomPlayerOne.status = GameMemberStatus.PLAYER_ONE;
      await queryRunner.manager
        .getRepository(GameMember)
        .save(gameRoomPlayerOne);

      const newGameResult = new GameResult();
      newGameResult.gameRoomId = newGameRoom.gameRoomId;
      newGameResult.ballSpeed = gameRoomCreateDto.ballSpeed;
      newGameResult.playerOneId = playerOneId;
      newGameResult.winPoint = gameRoomCreateDto.winPoint;
      await queryRunner.manager.getRepository(GameResult).save(newGameResult);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return this.getGameRoomTotalInfo(gameRoomReturned.gameRoomId);
  }
}
