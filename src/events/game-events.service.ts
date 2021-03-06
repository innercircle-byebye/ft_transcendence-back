import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameMember, GameMemberStatus } from 'src/entities/GameMember';
import { GameResult } from 'src/entities/GameResult';
import { GameRoom } from 'src/entities/GameRoom';
import { User } from 'src/entities/User';
import { Connection, Repository } from 'typeorm';
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
    private connection: Connection,
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

  async applyGameResult(room: Room) {
    const gameRoomId = room.gameRoomId();
    const { player1, player2 } = room.getPlayers();
    const playerOneId = player1.getUser().userId;
    const playerTwoId = player2.getUser().userId;
    const playerOneScore = player1.getScore();
    const plyaerTwoScore = player2.getScore();
    const winPoint = room.getWinPoint();
    const ballSpeed = room.getBallSpeed();

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ?????? ???????????? gameResult ??????
      const gameResult = await queryRunner.manager
        .getRepository(GameResult)
        .createQueryBuilder('gameResult')
        .where({ gameRoomId })
        .andWhere({ playerOneId })
        .andWhere({ playerTwoId })
        .andWhere('gameResult.startAt IS NOT NULL')
        .andWhere({ endAt: null })
        .getOne();

      // ????????? gameResult??? ?????? ???????????? ??????
      gameResult.endAt = new Date();
      gameResult.playerOneScore = playerOneScore;
      gameResult.playerTwoScore = plyaerTwoScore;
      await queryRunner.manager.getRepository(GameResult).save(gameResult);

      // ????????? gameResult ??????
      if (plyaerTwoScore > playerOneScore) {
        const playerOneGameMember = await queryRunner.manager
          .getRepository(GameMember)
          .findOne({
            where: {
              gameRoomId,
              userId: playerOneId,
            },
          });
        playerOneGameMember.status = GameMemberStatus.PLAYER_TWO;
        await queryRunner.manager
          .getRepository(GameMember)
          .save(playerOneGameMember);

        const playerTwoGameMember = await queryRunner.manager
          .getRepository(GameMember)
          .findOne({
            where: {
              gameRoomId,
              userId: playerTwoId,
            },
          });
        playerTwoGameMember.status = GameMemberStatus.PLAYER_ONE;
        await queryRunner.manager
          .getRepository(GameMember)
          .save(playerTwoGameMember);

        await queryRunner.manager.getRepository(GameResult).save({
          gameRoomId,
          playerOneId: playerTwoId,
          playerTwoId: playerOneId,
          winPoint,
          ballSpeed,
        });

        const playerTwouser = await queryRunner.manager
          .getRepository(User)
          .findOne({
            where: { userId: playerTwoId },
          });
        playerTwouser.experience += 42;
        await queryRunner.manager.getRepository(User).save(playerTwouser);
      } else {
        await queryRunner.manager.getRepository(GameResult).save({
          gameRoomId,
          playerOneId,
          playerTwoId,
          winPoint,
          ballSpeed,
        });
        const playerOneuser = await queryRunner.manager
          .getRepository(User)
          .findOne({
            where: { userId: playerOneId },
          });
        playerOneuser.experience += 42;
        await queryRunner.manager.getRepository(User).save(playerOneuser);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async countAllGameRoomObservers(gameRoomId: number): Promise<number> {
    return this.gameMemberRepository.count({
      where: { gameRoomId, status: GameMemberStatus.OBSERVER },
    });
  }

  async leaveGameRoom(userId: number, gameRoomId: number) {
    const checkGameMember = await this.gameMemberRepository.findOne({
      where: { gameRoomId, userId },
    });
    if (!checkGameMember) return;

    if (checkGameMember.status === GameMemberStatus.OBSERVER) {
      await this.gameMemberRepository.softRemove(checkGameMember);
      return;
    }

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
          .findOne({
            where: {
              gameRoomId,
              playerTwoId: userId,
              endAt: null,
            },
          });

        if (latestGameReseult.startAt) {
          latestGameReseult.endAt = new Date();
          latestGameReseult.playerOneScore = latestGameReseult.winPoint;
          latestGameReseult.playerTwoScore = 0;
          await queryRunner.manager
            .getRepository(GameResult)
            .save(latestGameReseult);

          const playerOneUser = await queryRunner.manager
            .getRepository(User)
            .findOne({
              where: { userId: latestGameReseult.playerOneId },
            });
          playerOneUser.experience += 42;
          await queryRunner.manager.getRepository(User).save(playerOneUser);

          await queryRunner.manager.getRepository(GameResult).save({
            gameRoomId,
            playerOneId: latestGameReseult.playerOneId,
            winPoint: latestGameReseult.winPoint,
            ballSpeed: latestGameReseult.ballSpeed,
          });
        } else {
          latestGameReseult.playerTwoId = null;
          await queryRunner.manager
            .getRepository(GameResult)
            .save(latestGameReseult);
        }
      } else if (checkGameMember.status === GameMemberStatus.PLAYER_ONE) {
        const checkGameMemberInPlayerTwo = await queryRunner.manager
          .getRepository(GameMember)
          .findOne({
            where: { gameRoomId, status: GameMemberStatus.PLAYER_TWO },
          });

        if (checkGameMemberInPlayerTwo) {
          // Player 2 becomes Player 1
          const latestGameReseult = await queryRunner.manager
            .getRepository(GameResult)
            .findOne({
              where: {
                gameRoomId,
                playerOneId: userId,
                endAt: null,
              },
            });

          if (latestGameReseult.startAt) {
            latestGameReseult.endAt = new Date();
            latestGameReseult.playerOneScore = 0;
            latestGameReseult.playerTwoScore = latestGameReseult.winPoint;
            await queryRunner.manager
              .getRepository(GameResult)
              .save(latestGameReseult);

            const playerTwoUser = await queryRunner.manager
              .getRepository(User)
              .findOne({
                where: { userId: latestGameReseult.playerTwoId },
              });
            playerTwoUser.experience += 42;
            await queryRunner.manager.getRepository(User).save(playerTwoUser);

            await queryRunner.manager.getRepository(GameResult).save({
              gameRoomId,
              playerOneId: latestGameReseult.playerTwoId,
              winPoint: latestGameReseult.winPoint,
              ballSpeed: latestGameReseult.ballSpeed,
            });
          } else {
            latestGameReseult.playerOneId = checkGameMemberInPlayerTwo.userId;
            latestGameReseult.playerTwoId = null;
            await queryRunner.manager
              .getRepository(GameResult)
              .save(latestGameReseult);
          }
          checkGameMemberInPlayerTwo.status = GameMemberStatus.PLAYER_ONE;
          await queryRunner.manager
            .getRepository(GameMember)
            .save(checkGameMemberInPlayerTwo);
        } else if ((await this.countAllGameRoomObservers(gameRoomId)) > 0) {
          // observer becomes player 1
          const observerToPlayerOne = await queryRunner.manager
            .getRepository(GameMember)
            .createQueryBuilder('gameMember')
            .where({ gameRoomId, status: GameMemberStatus.OBSERVER })
            .orderBy('gameMember.lastModifiedAt', 'ASC')
            .getOne();
          observerToPlayerOne.status = GameMemberStatus.PLAYER_ONE;
          await queryRunner.manager
            .getRepository(GameMember)
            .save(observerToPlayerOne);
          const latestGameReseult = await queryRunner.manager
            .getRepository(GameResult)
            .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
          latestGameReseult.playerOneId = observerToPlayerOne.userId;
          await queryRunner.manager
            .getRepository(GameResult)
            .save(latestGameReseult);
        } else {
          // remove gameResult
          const latestGameReseult = await queryRunner.manager
            .getRepository(GameResult)
            .findOne({ where: { gameRoomId, startAt: null, endAt: null } });
          await queryRunner.manager
            .getRepository(GameResult)
            .remove(latestGameReseult);

          // remove gameRoom
          const removeTargetGameRoom = await queryRunner.manager
            .getRepository(GameRoom)
            .find({ where: { gameRoomId } });
          await queryRunner.manager
            .getRepository(GameRoom)
            .softRemove(removeTargetGameRoom);
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
}
