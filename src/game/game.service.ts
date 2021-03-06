import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DmService } from 'src/dm/dm.service';
import { GameMember, GameMemberStatus } from 'src/entities/GameMember';
import { BallSpeed, GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User, UserStatus } from 'src/entities/User';
import { Brackets, Connection, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DMType } from 'src/entities/DM';
import { RoomManagerService } from 'src/events/game/services/room-manager.service';
import { GameResultUserDto } from './dto/gameresult-user.dto';
import { GameResultWinRateDto } from './dto/gameresult-winrate.dto';
import { GameRoomCreateDto } from './dto/gameroom-create.dto';
import { GameRoomUpdateDto } from './dto/gameroom-update.dto';
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
    private readonly roomManagerService: RoomManagerService,
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

  async checkUserAlreadyInGameRoom(id: number): Promise<boolean> {
    const gameMemberRepositoryCheck = await this.gameMemberRepository.findOne({
      where: { userId: id },
    });
    if (gameMemberRepositoryCheck) return true;
    return false;
  }

  async getAllGameRoomObserversId(gameRoomId: number): Promise<any[]> {
    const gameMemberRepositoryCheck = await this.gameMemberRepository.find({
      where: { gameRoomId, status: GameMemberStatus.OBSERVER },
    });

    const result = gameMemberRepositoryCheck.map((x) => x.userId);

    return result;
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

    if (!gameRoomForReturn)
      throw new BadRequestException('???????????? ???????????? ????????????.');

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

  countGameRooms() {
    return this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .addSelect('gameroom.password')
      .getCount();
  }

  async getAllGameRooms(): Promise<GameRoomDto[]> {
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

  async getAllGameRoomsWithPaging(perPage: number, page: number) {
    const allGameRoomsList = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .orderBy('gameroom.gameRoomId', 'ASC')
      .addSelect('gameroom.password')
      .limit(perPage)
      .offset(perPage * (page - 1))
      .getMany();

    const allGameRoomsConverted = await Promise.all(
      allGameRoomsList.map(async (gameRoomList: any) => {
        gameRoomList.gameMembers = await this.gameMemberRepository
          .createQueryBuilder('gamemember')
          .innerJoinAndSelect('gamemember.user', 'user')
          .where('gamemember.gameRoomId = :gameRoomId', {
            gameRoomId: gameRoomList.gameRoomId,
          })
          .select(['gamemember.status', 'gamemember.userId', 'user.nickname'])
          .getMany();
        gameRoomList.gameMembers.map((x) => {
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

  async getPlayableRooms() {
    const allGameRooms = (await this.getAllGameRooms()).filter((list) => {
      return (
        list.gameRoomStatus === GameRoomStatus.PLAYABLE &&
        list.isPrivate === false
      );
    });
    return allGameRooms[Math.floor(Math.random() * allGameRooms.length)];
  }

  async getObservableRooms() {
    const allGameRooms = (await this.getAllGameRooms()).filter((list) => {
      return (
        list.gameRoomStatus === GameRoomStatus.OBSERVABLE &&
        list.isPrivate === false
      );
    });
    return allGameRooms[Math.floor(Math.random() * allGameRooms.length)];
  }

  async createGameRoom(
    playerOneId: number,
    gameRoomCreateDto: GameRoomCreateDto,
    invitedUserId: number | null,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (
      gameRoomCreateDto.maxParticipantNum < 2 ||
      gameRoomCreateDto.maxParticipantNum > 8
    )
      throw new BadRequestException(
        '?????? ?????? ????????? ?????? 2??? ??????, ?????? 8??? ???????????????.',
      );
    if (gameRoomCreateDto.winPoint < 2 || gameRoomCreateDto.winPoint > 10)
      throw new BadRequestException(
        '?????? ?????? ????????? ?????? 2???, ?????? 10??? ?????????.',
      );
    const checkExistGameRoom = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .withDeleted()
      .where('gameroom.title = :title', { title: gameRoomCreateDto.title })
      .getOne();
    if (checkExistGameRoom)
      throw new BadRequestException('?????? ???????????? ????????? ???????????????.');

    let gameRoomReturned;
    try {
      const newGameRoom = new GameRoom();
      newGameRoom.title = gameRoomCreateDto.title;
      if (gameRoomCreateDto.password) {
        newGameRoom.password = await bcrypt.hash(
          gameRoomCreateDto.password,
          parseInt(process.env.BCRYPT_HASH_ROUNDS, 10),
        );
      }
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
    if (invitedUserId) {
      this.inviteUserToGame(
        gameRoomReturned.gameRoomId,
        playerOneId,
        invitedUserId,
      );
    }
    return this.getGameRoomTotalInfo(gameRoomReturned.gameRoomId);
  }

  async updateGameRoom(
    gameRoomId: number,
    playerOneId: number,
    gameRoomUpdateDto: GameRoomUpdateDto,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (
      gameRoomUpdateDto.maxParticipantNum < 2 ||
      gameRoomUpdateDto.maxParticipantNum > 8
    )
      throw new BadRequestException(
        '?????? ?????? ????????? ?????? 2??? ??????, ?????? 8??? ???????????????.',
      );
    if (gameRoomUpdateDto.winPoint < 2 || gameRoomUpdateDto.winPoint > 10)
      throw new BadRequestException(
        '?????? ?????? ????????? ?????? 2???, ?????? 10??? ?????????.',
      );
    const checkExistGameRoom = await this.gameRoomRepository
      .createQueryBuilder('gameroom')
      .withDeleted()
      .where('gameroom.title = :title', { title: gameRoomUpdateDto.title })
      .getOne();
    if (checkExistGameRoom && checkExistGameRoom.gameRoomId !== gameRoomId)
      throw new BadRequestException('?????? ???????????? ????????? ???????????????.');
    const checkGameRoomUpdateAuth = this.gameMemberRepository.findOne({
      where: [
        {
          gameRoomId,
          userId: playerOneId,
          status: 'player1',
        },
      ],
    });
    if (!checkGameRoomUpdateAuth)
      throw new BadRequestException('????????? ???????????? ????????? ????????????.');

    let updatedGameRoom;
    try {
      const targetGameRoom = await queryRunner.manager
        .getRepository(GameRoom)
        .findOne({ where: { gameRoomId } });
      if (gameRoomUpdateDto.title)
        targetGameRoom.title = gameRoomUpdateDto.title;

      if (gameRoomUpdateDto.password === null) {
        targetGameRoom.password = null;
      } else if (gameRoomUpdateDto.password) {
        targetGameRoom.password = await bcrypt.hash(
          gameRoomUpdateDto.password,
          parseInt(process.env.BCRYPT_HASH_ROUNDS, 10),
        );
      }
      if (gameRoomUpdateDto.maxParticipantNum)
        targetGameRoom.maxParticipantNum = gameRoomUpdateDto.maxParticipantNum;
      updatedGameRoom = await queryRunner.manager
        .getRepository(GameRoom)
        .save(targetGameRoom);
      const latestGameReseult = await queryRunner.manager
        .getRepository(GameResult)
        .findOne({
          where: [{ gameRoomId, startAt: null, endAt: null }],
        });
      if (gameRoomUpdateDto.ballSpeed)
        latestGameReseult.ballSpeed = gameRoomUpdateDto.ballSpeed;
      if (gameRoomUpdateDto.winPoint)
        latestGameReseult.winPoint = gameRoomUpdateDto.winPoint;
      await queryRunner.manager
        .getRepository(GameResult)
        .save(latestGameReseult);
      await queryRunner.commitTransaction();

      const roomId = this.roomManagerService.getGameRoomIdByUserId(playerOneId);
      const room = this.roomManagerService.getRoomsByGameRoomId().get(roomId);
      if (gameRoomUpdateDto.ballSpeed) {
        room?.setBallSpeed(gameRoomUpdateDto.ballSpeed);
      }
      if (gameRoomUpdateDto.winPoint) {
        room?.setWinPoint(gameRoomUpdateDto.winPoint);
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return this.getGameRoomTotalInfo(updatedGameRoom.gameRoomId);
  }

  async joinGameRoomAsPlayer(
    userId: number,
    gameRoomId: number,
    password: string,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (await this.checkUserAlreadyInGameRoom(userId))
      throw new BadRequestException('?????? ?????? ???????????? ??????????????????.');

    const checkGameRoom = await this.gameRoomRepository
      .createQueryBuilder('gameRoom')
      .addSelect('gameRoom.password')
      .where('gameRoom.gameRoomId = :gameRoomId', { gameRoomId })
      .getOne();

    // ??? ???????????? ??????
    if (!checkGameRoom)
      throw new BadRequestException('???????????? ???????????? ????????????.');

    // ??? ???????????? ??????
    if (checkGameRoom.password) {
      if (
        !password ||
        !(await bcrypt.compare(password, checkGameRoom.password))
      ) {
        throw new BadRequestException('??????????????? ???????????? ????????????.');
      }
    }

    // ????????? ??????????????????, ???????????? ?????? ????????? ??????
    const checkGameMemberInRoom = await this.gameMemberRepository.find({
      where: [{ gameRoomId }],
    });
    if (checkGameMemberInRoom.length >= checkGameRoom.maxParticipantNum) {
      throw new BadRequestException('???????????? ????????? ??? ????????????. (?????? ??????)');
    }
    checkGameMemberInRoom.forEach((gameMember) => {
      if (gameMember.status === GameMemberStatus.PLAYER_TWO) {
        throw new BadRequestException(
          '???????????? ????????? ??? ????????????. (???????????? ??????)',
        );
      }
    });

    const checkIfAlreadyJoined = await this.gameMemberRepository
      .createQueryBuilder('gameMembers')
      .where('gameMembers.gameRoomId = :gameRoomId', {
        gameRoomId,
      })
      .andWhere('gameMembers.userId = :userId', {
        userId,
      })
      .withDeleted()
      .getOne();
    if (checkIfAlreadyJoined && checkIfAlreadyJoined.banDate !== null)
      throw new BadRequestException('ban ????????? ????????? ?????????');

    try {
      let gameRoomPlayerTwo;
      if (checkIfAlreadyJoined) {
        gameRoomPlayerTwo = checkIfAlreadyJoined;
        gameRoomPlayerTwo.deletedAt = null;
      } else {
        gameRoomPlayerTwo = new GameMember();
        gameRoomPlayerTwo.gameRoomId = gameRoomId;
        gameRoomPlayerTwo.userId = userId;
      }
      gameRoomPlayerTwo.status = GameMemberStatus.PLAYER_TWO;
      await queryRunner.manager
        .getRepository(GameMember)
        .save(gameRoomPlayerTwo);

      const latestGameReseult = await queryRunner.manager
        .getRepository(GameResult)
        .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
      latestGameReseult.playerTwoId = userId;
      await queryRunner.manager
        .getRepository(GameResult)
        .save(latestGameReseult);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return this.getGameRoomTotalInfo(gameRoomId);
  }

  async joinGameRoomAsObserver(
    userId: number,
    gameRoomId: number,
    password: string,
  ) {
    if (await this.checkUserAlreadyInGameRoom(userId))
      throw new BadRequestException('?????? ?????? ???????????? ??????????????????.');

    const checkGameRoom = await this.gameRoomRepository
      .createQueryBuilder('gameRoom')
      .addSelect('gameRoom.password')
      .where('gameRoom.gameRoomId = :gameRoomId', { gameRoomId })
      .getOne();

    // ??? ???????????? ??????
    if (!checkGameRoom)
      throw new BadRequestException('???????????? ???????????? ????????????.');

    // ??? ???????????? ??????
    if (checkGameRoom.password) {
      if (
        !password ||
        !(await bcrypt.compare(password, checkGameRoom.password))
      ) {
        throw new BadRequestException('??????????????? ???????????? ????????????.');
      }
    }

    // ????????? ??????????????????
    const checkGameMemberInRoom = await this.gameMemberRepository.find({
      where: [{ gameRoomId }],
    });
    if (checkGameMemberInRoom.length >= checkGameRoom.maxParticipantNum) {
      throw new BadRequestException('???????????? ????????? ??? ????????????. (?????? ??????)');
    }

    const checkIfAlreadyJoined = await this.gameMemberRepository
      .createQueryBuilder('gameMembers')
      .where('gameMembers.gameRoomId = :gameRoomId', {
        gameRoomId,
      })
      .andWhere('gameMembers.userId = :userId', {
        userId,
      })
      .withDeleted()
      .getOne();
    if (checkIfAlreadyJoined) {
      if (checkIfAlreadyJoined.banDate !== null) {
        throw new BadRequestException('ban ????????? ????????? ?????????');
      }
      checkIfAlreadyJoined.status = GameMemberStatus.OBSERVER;
      checkIfAlreadyJoined.deletedAt = null;
      await this.gameMemberRepository.save(checkIfAlreadyJoined);
    } else {
      const gameRoomObserver = new GameMember();
      gameRoomObserver.gameRoomId = gameRoomId;
      gameRoomObserver.userId = userId;
      gameRoomObserver.status = GameMemberStatus.OBSERVER;
      await this.gameMemberRepository.save(gameRoomObserver);
    }
    return this.getGameRoomTotalInfo(gameRoomId);
  }

  async kickFromGameRoom(
    gameRoomId: number,
    userId: number,
    targetUserId: number,
  ) {
    if (userId === targetUserId) {
      throw new BadRequestException('????????? ?????????????????? ??? ????????????.');
    }
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom) {
      throw new BadRequestException('???????????? ???????????? ????????????.');
    }
    const checkGameMember = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId },
    });
    if (!checkGameMember) {
      throw new BadRequestException('?????? ???????????? ?????? ????????? ????????????.');
    }
    if (checkGameMember.status !== GameMemberStatus.PLAYER_ONE) {
      throw new BadRequestException('???????????? ????????? ????????????.');
    }
    const checkGameResult = await this.gameResultRepository.findOne({
      where: { gameRoomId, startAt: null, endAt: null },
    });
    if (!checkGameResult) {
      throw new BadRequestException('????????? ????????? ???????????? ?????? ??? ????????????.');
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const targetGameMember = await queryRunner.manager
        .getRepository(GameMember)
        .findOne({ where: { gameRoomId, userId: targetUserId } });

      if (!targetGameMember) {
        throw new BadRequestException(
          '???????????? ????????? ???????????? ???????????? ????????????.',
        );
      }

      if (targetGameMember.status === GameMemberStatus.PLAYER_TWO) {
        const gameResult = await queryRunner.manager
          .getRepository(GameResult)
          .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
        gameResult.playerTwoId = null;
        await queryRunner.manager.getRepository(GameResult).save(gameResult);
      }

      await queryRunner.manager
        .getRepository(GameMember)
        .softRemove(targetGameMember);
      await queryRunner.commitTransaction();

      this.roomManagerService.kick(targetUserId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async moveToPlayer(gameRoomId: number, userId: number) {
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom) {
      throw new BadRequestException('???????????? ???????????? ????????????.');
    }
    const checkGameMember = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId },
    });
    if (!checkGameMember) {
      throw new BadRequestException('?????? ???????????? ?????? ????????? ????????????.');
    }
    if (checkGameMember.status !== GameMemberStatus.OBSERVER) {
      throw new BadRequestException('?????? ?????????????????????.');
    }
    const checkExistPlayerTwo = await this.gameMemberRepository.findOne({
      where: { gameRoomId, status: GameMemberStatus.PLAYER_TWO },
    });
    if (checkExistPlayerTwo) {
      throw new BadRequestException('?????? ????????? ???????????? ????????? ????????????.');
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const gameMember = await queryRunner.manager
        .getRepository(GameMember)
        .findOne({ where: { gameRoomId, userId } });
      const gameResult = await queryRunner.manager
        .getRepository(GameResult)
        .findOne({ where: { gameRoomId, startAt: null, endAt: null } });

      gameMember.status = GameMemberStatus.PLAYER_TWO;
      gameResult.playerTwoId = userId;

      await queryRunner.manager.getRepository(GameMember).save(gameMember);
      await queryRunner.manager.getRepository(GameResult).save(gameResult);
      await queryRunner.commitTransaction();

      this.roomManagerService.moveToPlayer(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async moveToObserver(gameRoomId: number, userId: number) {
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom) {
      throw new BadRequestException('???????????? ???????????? ????????????.');
    }
    const checkGameMember = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId },
    });
    if (!checkGameMember) {
      throw new BadRequestException('?????? ???????????? ?????? ????????? ????????????.');
    }
    if (checkGameMember.status === GameMemberStatus.OBSERVER) {
      throw new BadRequestException('?????? ??????????????????.');
    }
    const checkGameResult = await this.gameResultRepository.findOne({
      where: { gameRoomId, startAt: null, endAt: null },
    });
    if (!checkGameResult) {
      throw new BadRequestException(
        '????????? ????????? ???????????? ????????? ??? ????????????.',
      );
    }
    const checkParticipantsCnt = await this.gameMemberRepository.count({
      where: { gameRoomId },
    });
    if (checkParticipantsCnt === 1) {
      throw new BadRequestException(
        '?????? ?????? ??????, ???????????? ????????? ??? ????????????.',
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const gameMember = await queryRunner.manager
        .getRepository(GameMember)
        .findOne({ where: { gameRoomId, userId } });
      const gameResult = await queryRunner.manager
        .getRepository(GameResult)
        .findOne({ where: { gameRoomId, startAt: null, endAt: null } });

      if (gameMember.status === GameMemberStatus.PLAYER_ONE) {
        // ????????????1??????
        if (gameResult.playerTwoId) {
          // ????????????2?????????
          const gameMemberPlayerTwo = await queryRunner.manager
            .getRepository(GameMember)
            .findOne({ where: { gameRoomId, userId: gameResult.playerTwoId } });
          gameMemberPlayerTwo.status = GameMemberStatus.PLAYER_ONE;
          await queryRunner.manager
            .getRepository(GameMember)
            .save(gameMemberPlayerTwo);

          gameMember.status = GameMemberStatus.OBSERVER;
          gameResult.playerOneId = gameResult.playerTwoId;
          gameResult.playerTwoId = null;
        } else {
          // ???????????? ?????????
          const gameMemberObserver = await queryRunner.manager
            .getRepository(GameMember)
            .createQueryBuilder('gameMember')
            .where({ gameRoomId, status: GameMemberStatus.OBSERVER })
            .orderBy('gameMember.lastModifiedAt', 'ASC')
            .getOne();
          gameMemberObserver.status = GameMemberStatus.PLAYER_ONE;
          await queryRunner.manager
            .getRepository(GameMember)
            .save(gameMemberObserver);

          gameMember.status = GameMemberStatus.OBSERVER;
          gameResult.playerOneId = gameMemberObserver.userId;
        }
      } else {
        // ????????????2??????
        gameMember.status = GameMemberStatus.OBSERVER;
        gameResult.playerTwoId = null;
      }

      await queryRunner.manager.getRepository(GameMember).save(gameMember);
      await queryRunner.manager.getRepository(GameResult).save(gameResult);
      await queryRunner.commitTransaction();

      this.roomManagerService.moveToObserver(userId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async countGameResultsOfUser(userId: number) {
    return (await this.getAllGameResults(userId)).length;
  }

  async getAllGameResults(userId: number): Promise<GameResultUserDto[]> {
    const result: any = await this.gameResultRepository
      .createQueryBuilder('gameresults')
      .orderBy('gameresults.endAt', 'DESC')
      .innerJoinAndSelect('gameresults.playerOne', 'playerOne')
      .innerJoinAndSelect('gameresults.playerTwo', 'playerTwo')
      .andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.startAt IS NOT NULL').andWhere(
            'gameresults.endAt is not null',
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.playerOneId = :userId', { userId }).orWhere(
            'gameresults.playerTwoId = :userId',
            { userId },
          );
        }),
      )
      .getMany();

    result.map((gameResults) => {
      gameResults.playerOneNickname = gameResults.playerOne.nickname;
      gameResults.playerTwoNickname = gameResults.playerTwo.nickname;
      delete gameResults.playerOne;
      delete gameResults.playerTwo;
      return gameResults;
    });
    return result;
  }

  async getGameResultsPagenation(
    perPage: number,
    page: number,
    userId: number,
    vsUserId: number,
    ballSpeed: string,
    date: Date,
  ): Promise<GameResultUserDto[]> {
    if (userId === vsUserId)
      throw new BadRequestException(
        '????????? ???????????? ?????? ???????????? ???????????????.',
      );

    let gameResultQueryBuilder: any = this.gameResultRepository
      .createQueryBuilder('gameresults')
      .innerJoinAndSelect('gameresults.playerOne', 'playerOne')
      .innerJoinAndSelect('gameresults.playerTwo', 'playerTwo')
      .orderBy('gameresults.endAt', 'DESC')
      .andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.startAt IS NOT NULL').andWhere(
            'gameresults.endAt is not null',
          );
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.playerOneId = :userId', { userId }).orWhere(
            'gameresults.playerTwoId = :userId',
            { userId },
          );
        }),
      );

    if (vsUserId) {
      const targetVsUser = await this.userRepository.findOne({
        where: { userId: vsUserId },
      });
      if (!targetVsUser)
        throw new BadRequestException('?????? ???????????? ???????????? ????????????.');

      gameResultQueryBuilder = gameResultQueryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.playerOneId = :userId', {
            userId: vsUserId,
          }).orWhere('gameresults.playerTwoId = :userId', {
            userId: vsUserId,
          });
        }),
      );
    }

    if (ballSpeed) {
      if (!Object.values(BallSpeed).some((v) => v === ballSpeed))
        throw new BadRequestException('???????????? ?????? ?????? ?????? ??? ?????????.');

      gameResultQueryBuilder = gameResultQueryBuilder.andWhere(
        'gameresults.ballSpeed = :ballSpeed',
        {
          ballSpeed,
        },
      );
    }

    if (date && !Number.isNaN(new Date(date).getTime())) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      console.log(startDate.getTimezoneOffset());
      startDate.setHours(startDate.getHours() - 9);
      endDate.setHours(endDate.getHours() + 14);
      endDate.setMinutes(endDate.getMinutes() + 59);
      endDate.setSeconds(endDate.getSeconds() + 59);
      console.log(startDate, endDate);
      gameResultQueryBuilder = gameResultQueryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('gameresults.startAt > :startDate', {
            startDate,
          }).andWhere('gameresults.endAt <= :endDate', {
            endDate,
          });
        }),
      );
    }

    if (perPage) {
      gameResultQueryBuilder = gameResultQueryBuilder.limit(perPage);
      if (page)
        gameResultQueryBuilder = gameResultQueryBuilder.offset(
          perPage * (page - 1),
        );
    }
    const result = await gameResultQueryBuilder.getMany();

    result.map((gameResults) => {
      gameResults.playerOneNickname = gameResults.playerOne.nickname;
      gameResults.playerTwoNickname = gameResults.playerTwo.nickname;
      delete gameResults.playerOne;
      delete gameResults.playerTwo;
      return gameResults;
    });
    return result;
  }

  getUserWinCount(userId: number, gameResults: GameResultUserDto[]): number {
    let winCount: number;
    winCount = 0;
    gameResults.forEach((item) => {
      if (item.playerOneId === userId) {
        if (item.playerOneScore === item.winPoint) winCount += 1;
      } else if (item.playerTwoId === userId) {
        if (item.playerTwoScore === item.winPoint) winCount += 1;
      }
    });
    return winCount;
  }

  async getUserWinRate(userId: number): Promise<GameResultWinRateDto> {
    const result = await this.getAllGameResults(userId);
    const totalPlayCount = result.length;
    const winCount = this.getUserWinCount(userId, result);
    const loseCount = totalPlayCount - winCount;
    const winRate = (winCount / totalPlayCount) * 100;
    const resultTwo: GameResultWinRateDto = {
      totalPlayCount,
      winCount,
      loseCount,
      winRate: Number.isNaN(winRate) ? '0' : winRate.toFixed(0),
    };
    return resultTwo;
  }

  async getAllUserRanking() {
    const result = await Promise.all(
      (
        await this.userRepository.find()
      )
        .map((x) => x.userId)
        .map(async (userId) => {
          const { totalPlayCount, winCount, loseCount, winRate } =
            await this.getUserWinRate(userId);
          const { nickname, imagePath, experience } =
            await this.userRepository.findOne({
              where: { userId },
            });
          return {
            totalPlayCount,
            winCount,
            loseCount,
            winRate,
            experience,
            user: {
              userId,
              nickname,
              imagePath,
            },
          };
        }),
    );
    result.sort((a, b) => {
      if (a.winCount > b.winCount) return -1;
      if (b.winCount > a.winCount) return 1;
      return 0;
    });
    return result;
  }

  getAllUserCount() {
    return this.userRepository.createQueryBuilder('user').getCount();
  }

  async getUserRaningWithPaging(perPage: number, pageNumber: number) {
    const result = await this.getAllUserRanking();

    return result.slice((pageNumber - 1) * perPage, pageNumber * perPage);
  }

  async inviteUserToGame(
    gameRoomId: number,
    userId: number,
    invitedUserId: number,
  ) {
    const targetChannel = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!targetChannel)
      throw new BadRequestException('?????? ?????? ?????? ??????????????????.');

    const targetUser = await this.userRepository.findOne({
      where: { userId: invitedUserId },
    });

    if (!targetUser)
      throw new BadRequestException('?????? ????????? ???????????? ????????????.');

    this.dmService.createDM(
      userId,
      invitedUserId,
      gameRoomId.toString(),
      DMType.GAME_INVITE,
    );

    return 'OK';
  }

  async findGameRoomByUserId(userId: number) {
    const checkUserInGame = await this.userRepository.findOne({
      where: { userId },
    });

    if (checkUserInGame.status !== UserStatus.IN_GAME)
      throw new BadRequestException('????????? ???????????? ????????????.');

    const gameMemberByUserId = await this.gameMemberRepository.findOne({
      where: { userId },
    });

    return this.getGameRoomTotalInfo(gameMemberByUserId.gameRoomId);
  }
}
