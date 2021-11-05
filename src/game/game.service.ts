import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DmService } from 'src/dm/dm.service';
import { GameMember, GameMemberStatus } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Connection, Repository } from 'typeorm';
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
    const gameMemberRepositoryCheck = this.gameMemberRepository.findOne({
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
      throw new BadRequestException('게임방이 존재하지 않습니다.');

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

  async getAllGameRoomsWithPaging(page: number) {
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
        '게임 참여 인원은 최소 2명 이상, 최대 8명 이하입니다.',
      );
    const checkExistGameRoom = await this.gameRoomRepository.findOne({
      where: [{ title: gameRoomUpdateDto.title, deletedAt: null }],
    });
    if (checkExistGameRoom)
      throw new BadRequestException('이미 존재하는 게임방 이름입니다.');

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
      throw new BadRequestException('게임방 업데이트 권한이 없습니다.');

    let updatedGameRoom;
    try {
      const targetGameRoom = await queryRunner.manager
        .getRepository(GameRoom)
        .findOne({ where: { gameRoomId } });
      if (gameRoomUpdateDto.title)
        targetGameRoom.title = gameRoomUpdateDto.title;
      if (typeof Object(gameRoomUpdateDto.password) !== undefined)
        targetGameRoom.password = gameRoomUpdateDto.password;
      if (
        typeof Object(gameRoomUpdateDto.maxParticipantNum) !== undefined &&
        targetGameRoom.maxParticipantNum !== gameRoomUpdateDto.maxParticipantNum
      )
        targetGameRoom.maxParticipantNum = gameRoomUpdateDto.maxParticipantNum;
      updatedGameRoom = await queryRunner.manager
        .getRepository(GameRoom)
        .save(targetGameRoom);
      const latestGameReseult = await queryRunner.manager
        .getRepository(GameResult)
        .findOne({
          where: [{ gameRoomId }, { startAt: null }, { endAt: null }],
        });
      if (gameRoomUpdateDto.ballSpeed)
        latestGameReseult.ballSpeed = gameRoomUpdateDto.ballSpeed;
      if (gameRoomUpdateDto.winPoint)
        latestGameReseult.winPoint = gameRoomUpdateDto.winPoint;
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

    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId, deletedAt: null },
    });
    if (!checkGameRoom)
      throw new BadRequestException('게임방이 존재하지 않습니다.');
    if (
      typeof Object(password) !== undefined &&
      checkGameRoom.password !== password
    )
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    const checkGameMemberInRoom = await this.gameMemberRepository.findOne({
      where: [{ gameRoomId, status: GameMemberStatus.PLAYER_TWO }],
    });
    if (this.checkUserAlreadyInGameRoom(userId))
      throw new BadRequestException('이미 다른 게임방에 참여중입니다.');

    if (checkGameMemberInRoom)
      throw new BadRequestException(
        '게임방에 참여할 수 없습니다. (플레이어 만석)',
      );
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
      throw new BadRequestException('ban 처리된 사용자 입니다');

    try {
      let gameRoomPlayerTwo;
      if (checkIfAlreadyJoined) gameRoomPlayerTwo = checkIfAlreadyJoined;
      else gameRoomPlayerTwo = new GameMember();
      gameRoomPlayerTwo.gameRoomId = gameRoomId;
      gameRoomPlayerTwo.userId = userId;
      gameRoomPlayerTwo.status = GameMemberStatus.PLAYER_TWO;

      if (checkIfAlreadyJoined)
        await queryRunner.manager
          .getRepository(GameMember)
          .restore(gameRoomPlayerTwo);
      else
        await queryRunner.manager
          .getRepository(GameMember)
          .save(gameRoomPlayerTwo);

      // TODO: 잘 가져오는지 검증 필요
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
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId, deletedAt: null },
    });
    if (!checkGameRoom)
      throw new BadRequestException('게임방이 존재하지 않습니다.');
    if (
      typeof Object(password) !== undefined &&
      checkGameRoom.password !== password
    )
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    if (this.checkUserAlreadyInGameRoom(userId))
      throw new BadRequestException('이미 다른 게임방에 참여중입니다.');

    let currentObserverCount;
    currentObserverCount = await this.getCurrentGameRoomMemberCount(gameRoomId);
    if (
      this.gameMemberRepository.findOne({
        where: [{ gameRoomId, status: GameMemberStatus.PLAYER_TWO }],
      }) === undefined
    )
      currentObserverCount -= 2;
    else currentObserverCount -= 1;

    if (checkGameRoom.maxParticipantNum - 2 <= currentObserverCount)
      throw new BadRequestException(
        '게임방에 참여할 수 없습니다. (관전 정원 초과)',
      );

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
      if (checkIfAlreadyJoined.banDate !== null)
        throw new BadRequestException('ban 처리된 사용자 입니다');
      await this.gameMemberRepository.restore(checkIfAlreadyJoined);
    } else {
      const gameRoomObserver = new GameMember();
      gameRoomObserver.gameRoomId = gameRoomId;
      gameRoomObserver.userId = userId;
      gameRoomObserver.status = GameMemberStatus.OBSERVER;
      await this.gameMemberRepository.save(gameRoomObserver);
    }
    return this.getGameRoomTotalInfo(gameRoomId);
  }

  async leaveGameRoom(userId: number, gameRoomId: number) {
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom)
      throw new BadRequestException('게임방이 존재하지 않습니다.');
    const checkGameMember = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId },
    });
    if (!checkGameMember)
      throw new BadRequestException('게임방에 유저가 존재 하지 않습니다.');

    if (checkGameMember.status === GameMemberStatus.OBSERVER) {
      await this.gameMemberRepository.softRemove(checkGameMember);
    } else {
      const queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.manager
          .getRepository(GameMember)
          .softRemove(checkGameMember);

        if (checkGameMember.status === GameMemberStatus.PLAYER_TWO) {
          const latestGameReseult = await queryRunner.manager
            .getRepository(GameResult)
            .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
          latestGameReseult.playerTwoId = null;
          await queryRunner.manager
            .getRepository(GameResult)
            .save(latestGameReseult);
        } else if (checkGameMember.status === GameMemberStatus.PLAYER_ONE) {
          const checkGameMemberInPlayerTwo = await queryRunner.manager
            .getRepository(GameMember)
            .findOne({
              where: { gameRoomId, status: GameMemberStatus.PLAYER_TWO },
            });
          // Player 2 becomes Player 1
          if (checkGameMemberInPlayerTwo) {
            const latestGameReseult = await queryRunner.manager
              .getRepository(GameResult)
              .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
            latestGameReseult.playerOneId = checkGameMemberInPlayerTwo.userId;
            latestGameReseult.playerTwoId = null;
            await queryRunner.manager
              .getRepository(GameResult)
              .save(latestGameReseult);
            checkGameMemberInPlayerTwo.status = GameMemberStatus.PLAYER_ONE;
            await queryRunner.manager
              .getRepository(GameMember)
              .save(checkGameMemberInPlayerTwo);
          } else {
            // remove gameroom
            const latestGameReseult = await queryRunner.manager
              .getRepository(GameResult)
              .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
            await queryRunner.manager
              .getRepository(GameResult)
              .remove(latestGameReseult);
            await Promise.all(
              (
                await this.getAllGameRoomObserversId(gameRoomId)
              ).map(async (observerUserID) => {
                const observerInGameRoom = await queryRunner.manager
                  .getRepository(GameMember)
                  .findOne({ where: { gameRoomId, userId: observerUserID } });
                console.log(observerInGameRoom);
                await queryRunner.manager
                  .getRepository(GameMember)
                  .softRemove(observerInGameRoom);
              }),
            );
          }
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
    return 'OK';
  }

  async banGameMember(
    gameRoomId: number,
    playerOneId: number,
    targetUserId: number,
    banDate: Date,
  ) {
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom)
      throw new BadRequestException('게임방이 존재하지 않습니다.');
    const checkPlayerOne = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId: playerOneId },
    });
    if (checkPlayerOne.status !== GameMemberStatus.PLAYER_ONE)
      throw new BadRequestException('차단 권한이 없습니다');
    const targetUser = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId: targetUserId },
    });
    if (!targetUser)
      throw new BadRequestException('게임방에 유저가 존재 하지 않습니다.');

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let returnTargetUser;
    try {
      targetUser.banDate = banDate;
      await queryRunner.manager.getRepository(GameMember).save(targetUser);
      returnTargetUser = await queryRunner.manager
        .getRepository(GameMember)
        .softRemove(targetUser);
      if (targetUser.status === GameMemberStatus.PLAYER_TWO) {
        const latestGameReseult = await queryRunner.manager
          .getRepository(GameResult)
          .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
        latestGameReseult.playerTwoId = null;
        await queryRunner.manager
          .getRepository(GameResult)
          .save(latestGameReseult);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return returnTargetUser;
  }

  async restoreGameMemberFromBan(
    gameRoomId: number,
    playerOneId: number,
    userId: number,
  ) {
    const checkGameRoom = await this.gameRoomRepository.findOne({
      where: { gameRoomId },
    });
    if (!checkGameRoom)
      throw new BadRequestException('게임방이 존재하지 않습니다.');
    const checkPlayerOne = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId: playerOneId },
    });
    if (checkPlayerOne.status !== GameMemberStatus.PLAYER_ONE)
      throw new BadRequestException('차단 권한이 없습니다');
    const targetUser = await this.gameMemberRepository
      .createQueryBuilder('gameMembers')
      .where('gameMembers.gameRoomId = :gameRoomId', {
        gameRoomId,
      })
      .andWhere('gameMembers.userId = :target', {
        target: userId,
      })
      .withDeleted()
      .getOne();
    if (!targetUser)
      throw new BadRequestException('게임방에 유저가 존재 하지 않습니다.');
    if (!targetUser.banDate)
      throw new BadRequestException('해당 유저의 차단 기록이 없습니다.');
    targetUser.banDate = null;
    return this.gameMemberRepository.save(targetUser);
    // const queryRunner = this.connection.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    // try {
    //   await queryRunner.manager.getRepository(GameMember).save(targetUser);
    //   await queryRunner.manager
    //     .getRepository(GameMember)
    //     .softRemove(targetUser);
    //   if (targetUser.status === GameMemberStatus.PLAYER_TWO) {
    //     const latestGameReseult = await queryRunner.manager
    //       .getRepository(GameResult)
    //       .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
    //     latestGameReseult.playerTwoId = null;
    //     await queryRunner.manager
    //       .getRepository(GameResult)
    //       .save(latestGameReseult);
    //   }
    //   await queryRunner.commitTransaction();
    // } catch (error) {
    //   await queryRunner.rollbackTransaction();
    //   throw error;
    // } finally {
    //   await queryRunner.release();
    // }
  }
}
